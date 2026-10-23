import { jest } from "@jest/globals";

jest.mock("../src/routes/upload.route", () => {
  const express = require("express");
  const router = express.Router();
  return router;
});

jest.mock("../src/lib/s3", () => ({
  s3: { send: jest.fn() },
}));

import dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import { AuthService } from "../src/services/auth.service";
import app from "../src/app";
import prisma, { pool } from "../src/lib/prisma";

// ────────────────────────────────────────────
// 테스트 데이터
// ────────────────────────────────────────────
const superAdminPayload = {
  username: "event_superadmin",
  password: "password123!",
  name: "최고관리자",
  contact: "01077770000",
  email: "event_super@test.com",
  joinStatus: "APPROVED",
  role: "SUPER_ADMIN",
};

const adminPayload = {
  username: "event_admin",
  password: "password123!",
  passwordConfirm: "password123!",
  name: "관리자",
  contact: "01077770001",
  email: "event_admin@test.com",
  role: "ADMIN",
  description: "테스트용 아파트 관리자입니다.",
  apartmentName: "이벤트테스트아파트",
  apartmentAddress: "서울시 강남구 이벤트동 789",
  apartmentManagementNumber: "0212345680",
  startComplexNumber: "1",
  endComplexNumber: "5",
  startDongNumber: "101",
  endDongNumber: "105",
  startFloorNumber: "1",
  endFloorNumber: "20",
  startHoNumber: "1",
  endHoNumber: "4",
};

const userPayload = {
  username: "event_user",
  password: "password123!",
  name: "입주민",
  contact: "01077770002",
  email: "event_user@test.com",
  role: "USER",
  apartmentName: "이벤트테스트아파트",
  apartmentDong: "101",
  apartmentHo: "1",
};

// ────────────────────────────────────────────

describe("Event 도메인 통합 테스트", () => {
  let superAdminCookie: string[];
  let adminCookie: string[];
  let userCookie: string[];
  let apartmentId: string;
  let noticeBoardId: string;
  let noticeId: string;
  let createdEventId: string;

  beforeAll(async () => {
    // DB 초기화 - event 테스트 관련 데이터만
    await prisma.event.deleteMany({
      where: { apartment: { name: "이벤트테스트아파트" } },
    });
    await prisma.notice.deleteMany({
      where: { board: { apartment: { name: "이벤트테스트아파트" } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { username: { startsWith: "event_" } } },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: "event_" } },
    });
    await prisma.board.deleteMany({
      where: { apartment: { name: "이벤트테스트아파트" } },
    });
    await prisma.apartment.deleteMany({
      where: { name: "이벤트테스트아파트" },
    });

    // 슈퍼어드민 생성 및 로그인
    await new AuthService().createSuperAdmin({ ...superAdminPayload, role: "SUPER_ADMIN", joinStatus: "APPROVED" });
    const superAdminLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: superAdminPayload.username, password: superAdminPayload.password });
    const superCookieHeader = superAdminLogin.get("Set-Cookie");
    if (!superCookieHeader) throw new Error("슈퍼어드민 쿠키 없음");
    superAdminCookie = Array.isArray(superCookieHeader) ? superCookieHeader : [superCookieHeader];

    // 관리자 회원가입 → 승인 → 로그인
    await request(app).post("/api/auth/signup/admin").send(adminPayload);
    const admin = await prisma.user.findUnique({ where: { username: adminPayload.username } });
    await request(app)
      .patch(`/api/auth/admins/${admin?.id}/status`)
      .set("Cookie", superAdminCookie)
      .send({ status: "APPROVED" });
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: adminPayload.username, password: adminPayload.password });
    const adminCookieHeader = adminLogin.get("Set-Cookie");
    if (!adminCookieHeader) throw new Error("관리자 쿠키 없음");
    adminCookie = Array.isArray(adminCookieHeader) ? adminCookieHeader : [adminCookieHeader];

    // 입주민 회원가입 → 승인 → 로그인
    await request(app).post("/api/auth/signup").send(userPayload);
    const user = await prisma.user.findUnique({ where: { username: userPayload.username } });
    await request(app)
      .patch(`/api/auth/residents/${user?.id}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "APPROVED" });
    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: userPayload.username, password: userPayload.password });
    const userCookieHeader = userLogin.get("Set-Cookie");
    if (!userCookieHeader) throw new Error("입주민 쿠키 없음");
    userCookie = Array.isArray(userCookieHeader) ? userCookieHeader : [userCookieHeader];

    // apartmentId, boardId 가져오기
    const apartment = await prisma.apartment.findFirst({
      where: { name: adminPayload.apartmentName },
      include: { boards: true },
    });
    if (!apartment) throw new Error("아파트 없음");
    apartmentId = apartment.id;
    const noticeBoard = apartment.boards.find((b) => b.type === "NOTICE");
    if (!noticeBoard) throw new Error("NOTICE 게시판 없음");
    noticeBoardId = noticeBoard.id;

    // 테스트용 공지사항 생성
    const notice = await prisma.notice.create({
      data: {
        title: "이벤트 테스트 공지",
        content: "이벤트 생성 테스트용 공지입니다.",
        category: "MAINTENANCE",
        boardId: noticeBoardId,
        authorId: admin?.id ?? "",
        startDate: new Date("2025-06-13T00:00:00.000Z"),
        endDate: new Date("2025-06-15T23:59:59.999Z"),
      },
    });
    noticeId = notice.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  // ────────────────────────────────────────────
  // PUT /api/event — 이벤트 생성/업데이트
  // ────────────────────────────────────────────
  describe("PUT /api/event — 이벤트 생성/업데이트", () => {
    it("관리자가 공지사항 기반 이벤트를 생성해야 한다", async () => {
      const res = await request(app).put("/api/event").set("Cookie", adminCookie).query({
        boardType: "NOTICE",
        boardId: noticeId,
        startDate: "2025-06-13T00:00:00.000Z",
        endDate: "2025-06-15T23:59:59.999Z",
      });

      expect(res.status).toBe(204);

      // DB에 이벤트 생성됐는지 확인
      const event = await prisma.event.findFirst({
        where: { boardId: noticeId },
      });
      expect(event).not.toBeNull();
      expect(event?.title).toBe("이벤트 테스트 공지");
      createdEventId = event?.id ?? "";
    });

    it("같은 boardId로 다시 PUT하면 업데이트해야 한다", async () => {
      const res = await request(app).put("/api/event").set("Cookie", adminCookie).query({
        boardType: "NOTICE",
        boardId: noticeId,
        startDate: "2025-06-14T00:00:00.000Z",
        endDate: "2025-06-16T23:59:59.999Z",
      });

      expect(res.status).toBe(204);

      // 이벤트가 새로 생기지 않고 업데이트됐는지 확인
      const events = await prisma.event.findMany({
        where: { boardId: noticeId },
      });
      expect(events).toHaveLength(1);
      expect(new Date(events[0]!.start).toISOString()).toBe("2025-06-14T00:00:00.000Z");
    });

    it("존재하지 않는 boardId로 이벤트 생성 시 404를 반환해야 한다", async () => {
      const res = await request(app).put("/api/event").set("Cookie", adminCookie).query({
        boardType: "NOTICE",
        boardId: "non-existent-id",
        startDate: "2025-06-13T00:00:00.000Z",
        endDate: "2025-06-15T23:59:59.999Z",
      });

      expect(res.status).toBe(404);
    });

    it("유효하지 않은 boardType이면 400을 반환해야 한다", async () => {
      const res = await request(app).put("/api/event").set("Cookie", adminCookie).query({
        boardType: "INVALID",
        boardId: noticeId,
        startDate: "2025-06-13T00:00:00.000Z",
        endDate: "2025-06-15T23:59:59.999Z",
      });

      expect(res.status).toBe(400);
    });

    it("입주민이 이벤트 생성 시도하면 403을 반환해야 한다", async () => {
      const res = await request(app).put("/api/event").set("Cookie", userCookie).query({
        boardType: "NOTICE",
        boardId: noticeId,
        startDate: "2025-06-13T00:00:00.000Z",
        endDate: "2025-06-15T23:59:59.999Z",
      });

      expect(res.status).toBe(403);
    });

    it("인증 토큰 없이 이벤트 생성 시 401을 반환해야 한다", async () => {
      const res = await request(app).put("/api/event").query({
        boardType: "NOTICE",
        boardId: noticeId,
        startDate: "2025-06-13T00:00:00.000Z",
        endDate: "2025-06-15T23:59:59.999Z",
      });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // GET /api/event — 이벤트 목록 조회
  // ────────────────────────────────────────────
  describe("GET /api/event — 이벤트 목록 조회", () => {
    it("관리자가 특정 월의 이벤트 목록을 조회해야 한다", async () => {
      const res = await request(app)
        .get("/api/event")
        .set("Cookie", adminCookie)
        .query({ apartmentId, year: 2025, month: 6 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toMatchObject({
        id: expect.any(String),
        start: expect.any(String),
        end: expect.any(String),
        title: expect.any(String),
        category: expect.any(String),
        type: expect.any(String),
      });
    });

    it("입주민도 이벤트 목록을 조회할 수 있어야 한다", async () => {
      const res = await request(app)
        .get("/api/event")
        .set("Cookie", userCookie)
        .query({ apartmentId, year: 2025, month: 6 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("해당 월에 이벤트가 없으면 빈 배열을 반환해야 한다", async () => {
      const res = await request(app)
        .get("/api/event")
        .set("Cookie", adminCookie)
        .query({ apartmentId, year: 2020, month: 1 });

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("apartmentId 없이 조회 시 400을 반환해야 한다", async () => {
      const res = await request(app).get("/api/event").set("Cookie", adminCookie).query({ year: 2025, month: 6 });

      expect(res.status).toBe(400);
    });

    it("인증 토큰 없이 조회 시 401을 반환해야 한다", async () => {
      const res = await request(app).get("/api/event").query({ apartmentId, year: 2025, month: 6 });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // DELETE /api/event/:eventId — 이벤트 삭제
  // ────────────────────────────────────────────
  describe("DELETE /api/event/:eventId — 이벤트 삭제", () => {
    it("관리자가 이벤트를 삭제해야 한다", async () => {
      const res = await request(app).delete(`/api/event/${createdEventId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("이벤트가 삭제되었습니다.");
    });

    it("이미 삭제된 이벤트 삭제 시 404를 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/event/${createdEventId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });

    it("존재하지 않는 이벤트 삭제 시 404를 반환해야 한다", async () => {
      const res = await request(app).delete("/api/event/non-existent-id").set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });

    it("입주민이 이벤트 삭제 시도하면 403을 반환해야 한다", async () => {
      // 삭제할 이벤트 새로 생성
      const event = await prisma.event.create({
        data: {
          title: "삭제 테스트 이벤트",
          category: "MAINTENANCE",
          type: "NOTICE",
          boardType: "NOTICE",
          boardId: noticeId,
          apartmentId,
          start: new Date("2025-06-13T00:00:00.000Z"),
          end: new Date("2025-06-15T23:59:59.999Z"),
        },
      });

      const res = await request(app).delete(`/api/event/${event.id}`).set("Cookie", userCookie);

      expect(res.status).toBe(403);
    });

    it("인증 토큰 없이 삭제 시 401을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/event/${createdEventId}`);

      expect(res.status).toBe(401);
    });
  });
});
