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
  username: "notice_superadmin",
  password: "password123!",
  name: "최고관리자",
  contact: "01066660000",
  email: "notice_super@test.com",
  joinStatus: "APPROVED",
  role: "SUPER_ADMIN",
};

const adminPayload = {
  username: "notice_admin",
  password: "password123!",
  passwordConfirm: "password123!",
  name: "관리자",
  contact: "01066660001",
  email: "notice_admin@test.com",
  role: "ADMIN",
  description: "테스트용 아파트 관리자입니다.",
  apartmentName: "공지테스트아파트",
  apartmentAddress: "서울시 강남구 공지동 123",
  apartmentManagementNumber: "0212345681",
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
  username: "notice_user",
  password: "password123!",
  name: "입주민",
  contact: "01066660002",
  email: "notice_user@test.com",
  role: "USER",
  apartmentName: "공지테스트아파트",
  apartmentDong: "101",
  apartmentHo: "1",
};

// ────────────────────────────────────────────

describe("Notice 도메인 통합 테스트", () => {
  let superAdminCookie: string[];
  let adminCookie: string[];
  let userCookie: string[];
  let boardId: string;
  let createdNoticeId: string;

  beforeAll(async () => {
    // DB 초기화
    await prisma.notification.deleteMany({
      where: { user: { username: { startsWith: "notice_" } } },
    });
    await prisma.notice.deleteMany({
      where: { board: { apartment: { name: "공지테스트아파트" } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { username: { startsWith: "notice_" } } },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: "notice_" } },
    });
    await prisma.board.deleteMany({
      where: { apartment: { name: "공지테스트아파트" } },
    });
    await prisma.apartment.deleteMany({
      where: { name: "공지테스트아파트" },
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

    // NOTICE 게시판 ID 가져오기
    const apartment = await prisma.apartment.findFirst({
      where: { name: adminPayload.apartmentName },
      include: { boards: true },
    });
    const noticeBoard = apartment?.boards.find((b) => b.type === "NOTICE");
    if (!noticeBoard) throw new Error("NOTICE 게시판 없음");
    boardId = noticeBoard.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  // ────────────────────────────────────────────
  // POST /api/notices — 공지사항 등록
  // ────────────────────────────────────────────
  describe("POST /api/notices — 공지사항 등록", () => {
    it("관리자가 공지사항을 정상적으로 등록해야 한다", async () => {
      const res = await request(app).post("/api/notices").set("Cookie", adminCookie).send({
        category: "MAINTENANCE",
        title: "엘리베이터 점검 안내",
        content: "엘리베이터 정기 점검이 있을 예정입니다.",
        boardId,
        isPinned: false,
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("정상적으로 등록 처리되었습니다");

      // DB에서 생성된 공지사항 ID 가져오기
      const notice = await prisma.notice.findFirst({
        where: { title: "엘리베이터 점검 안내" },
      });
      createdNoticeId = notice?.id ?? "";
    });

    it("startDate가 있으면 이벤트가 자동 등록되어야 한다", async () => {
      const res = await request(app).post("/api/notices").set("Cookie", adminCookie).send({
        category: "COMMUNITY",
        title: "주민 모임 안내",
        content: "주민 모임이 있습니다.",
        boardId,
        isPinned: false,
        startDate: "2025-07-01T00:00:00.000Z",
        endDate: "2025-07-01T23:59:59.999Z",
      });

      expect(res.status).toBe(201);

      const notice = await prisma.notice.findFirst({
        where: { title: "주민 모임 안내" },
      });
      const event = await prisma.event.findFirst({
        where: { boardId: notice?.id },
      });
      expect(event).not.toBeNull();
    });

    it("입주민이 공지사항 등록 시도하면 403을 반환해야 한다", async () => {
      const res = await request(app).post("/api/notices").set("Cookie", userCookie).send({
        category: "MAINTENANCE",
        title: "테스트",
        content: "테스트",
        boardId,
        isPinned: false,
      });

      expect(res.status).toBe(403);
    });

    it("category가 없으면 400을 반환해야 한다", async () => {
      const res = await request(app).post("/api/notices").set("Cookie", adminCookie).send({
        title: "테스트",
        content: "테스트",
        boardId,
        isPinned: false,
      });

      expect(res.status).toBe(400);
    });

    it("인증 토큰 없이 등록 시 401을 반환해야 한다", async () => {
      const res = await request(app).post("/api/notices").send({
        category: "MAINTENANCE",
        title: "테스트",
        content: "테스트",
        boardId,
        isPinned: false,
      });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // GET /api/notices — 공지사항 목록 조회
  // ────────────────────────────────────────────
  describe("GET /api/notices — 공지사항 목록 조회", () => {
    it("관리자가 공지사항 목록을 조회해야 한다", async () => {
      const res = await request(app).get("/api/notices").set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("notices");
      expect(res.body).toHaveProperty("totalCount");
      expect(Array.isArray(res.body.notices)).toBe(true);
      expect(res.body.notices[0]).toMatchObject({
        noticeId: expect.any(String),
        category: expect.any(String),
        title: expect.any(String),
        writerName: expect.any(String),
      });
    });

    it("입주민도 공지사항 목록을 조회할 수 있어야 한다", async () => {
      const res = await request(app).get("/api/notices").set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.notices)).toBe(true);
    });

    it("category 필터로 조회할 수 있어야 한다", async () => {
      const res = await request(app).get("/api/notices").set("Cookie", adminCookie).query({ category: "MAINTENANCE" });

      expect(res.status).toBe(200);
      res.body.notices.forEach((n: any) => {
        expect(n.category).toBe("MAINTENANCE");
      });
    });

    it("search 필터로 조회할 수 있어야 한다", async () => {
      const res = await request(app).get("/api/notices").set("Cookie", adminCookie).query({ search: "엘리베이터" });

      expect(res.status).toBe(200);
      expect(res.body.notices.some((n: any) => n.title.includes("엘리베이터"))).toBe(true);
    });

    it("인증 토큰 없이 조회 시 401을 반환해야 한다", async () => {
      const res = await request(app).get("/api/notices");
      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // GET /api/notices/:noticeId — 공지사항 상세 조회
  // ────────────────────────────────────────────
  describe("GET /api/notices/:noticeId — 공지사항 상세 조회", () => {
    it("공지사항 상세를 정상적으로 조회해야 한다", async () => {
      const res = await request(app).get(`/api/notices/${createdNoticeId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        noticeId: createdNoticeId,
        title: "엘리베이터 점검 안내",
        category: "MAINTENANCE",
        boardName: expect.any(String),
        comments: expect.any(Array),
      });
    });

    it("조회 시 viewsCount가 증가해야 한다", async () => {
      const res1 = await request(app).get(`/api/notices/${createdNoticeId}`).set("Cookie", userCookie);
      const res2 = await request(app).get(`/api/notices/${createdNoticeId}`).set("Cookie", userCookie);

      expect(res2.body.viewsCount).toBeGreaterThan(res1.body.viewsCount);
    });

    it("존재하지 않는 공지사항 조회 시 404를 반환해야 한다", async () => {
      const res = await request(app).get("/api/notices/non-existent-id").set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 조회 시 401을 반환해야 한다", async () => {
      const res = await request(app).get(`/api/notices/${createdNoticeId}`);
      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // PATCH /api/notices/:noticeId — 공지사항 수정
  // ────────────────────────────────────────────
  describe("PATCH /api/notices/:noticeId — 공지사항 수정", () => {
    it("관리자가 공지사항을 수정해야 한다", async () => {
      const res = await request(app).patch(`/api/notices/${createdNoticeId}`).set("Cookie", adminCookie).send({
        title: "수정된 엘리베이터 점검 안내",
        isPinned: true,
      });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        noticeId: createdNoticeId,
        title: "수정된 엘리베이터 점검 안내",
        isPinned: true,
      });
    });

    it("입주민이 공지사항 수정 시도하면 403을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/notices/${createdNoticeId}`)
        .set("Cookie", userCookie)
        .send({ title: "수정 시도" });

      expect(res.status).toBe(403);
    });

    it("존재하지 않는 공지사항 수정 시 404를 반환해야 한다", async () => {
      const res = await request(app)
        .patch("/api/notices/non-existent-id")
        .set("Cookie", adminCookie)
        .send({ title: "수정" });

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 수정 시 401을 반환해야 한다", async () => {
      const res = await request(app).patch(`/api/notices/${createdNoticeId}`).send({ title: "수정" });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // DELETE /api/notices/:noticeId — 공지사항 삭제
  // ────────────────────────────────────────────
  describe("DELETE /api/notices/:noticeId — 공지사항 삭제", () => {
    it("입주민이 공지사항 삭제 시도하면 403을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/notices/${createdNoticeId}`).set("Cookie", userCookie);

      expect(res.status).toBe(403);
    });

    it("관리자가 공지사항을 삭제해야 한다", async () => {
      const res = await request(app).delete(`/api/notices/${createdNoticeId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("정상적으로 삭제 처리되었습니다");
    });

    it("이미 삭제된 공지사항 삭제 시 404를 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/notices/${createdNoticeId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 삭제 시 401을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/notices/${createdNoticeId}`);
      expect(res.status).toBe(401);
    });
  });
});
