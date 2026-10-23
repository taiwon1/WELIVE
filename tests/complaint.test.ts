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
  username: "complaint_superadmin",
  password: "password123!",
  name: "최고관리자",
  contact: "01088880000",
  email: "complaint_super@test.com",
  joinStatus: "APPROVED",
  role: "SUPER_ADMIN",
};

const adminPayload = {
  username: "complaint_admin",
  password: "password123!",
  passwordConfirm: "password123!",
  name: "관리자",
  contact: "01088880001",
  email: "complaint_admin@test.com",
  role: "ADMIN",
  description: "테스트용 아파트 관리자입니다.",
  apartmentName: "민원테스트아파트",
  apartmentAddress: "서울시 강남구 민원동 456",
  apartmentManagementNumber: "0212345679",
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
  username: "complaint_user",
  password: "password123!",
  name: "입주민",
  contact: "01088880002",
  email: "complaint_user@test.com",
  role: "USER",
  apartmentName: "민원테스트아파트",
  apartmentDong: "101",
  apartmentHo: "1",
};

const user2Payload = {
  username: "complaint_user2",
  password: "password123!",
  name: "입주민2",
  contact: "01088880003",
  email: "complaint_user2@test.com",
  role: "USER",
  apartmentName: "민원테스트아파트",
  apartmentDong: "101",
  apartmentHo: "2",
};

// ────────────────────────────────────────────

describe("Complaint 도메인 통합 테스트", () => {
  let superAdminCookie: string[];
  let adminCookie: string[];
  let userCookie: string[];
  let user2Cookie: string[];
  let boardId: string;
  let createdComplaintId: string;

  beforeAll(async () => {
    // DB 초기화
    await prisma.notification.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.board.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.resident.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.user.deleteMany();

    // 슈퍼어드민 생성 및 로그인
    await new AuthService().createSuperAdmin({ ...superAdminPayload, role: "SUPER_ADMIN", joinStatus: "APPROVED" });
    const superAdminLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: superAdminPayload.username, password: superAdminPayload.password });
    const superAdminCookieHeader = superAdminLogin.get("Set-Cookie");
    if (!superAdminCookieHeader) throw new Error("슈퍼어드민 쿠키 없음");
    superAdminCookie = Array.isArray(superAdminCookieHeader) ? superAdminCookieHeader : [superAdminCookieHeader];

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

    // 입주민1 회원가입 → 승인 → 로그인
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

    // 입주민2 회원가입 → 승인 → 로그인
    await request(app).post("/api/auth/signup").send(user2Payload);
    const user2 = await prisma.user.findUnique({ where: { username: user2Payload.username } });
    await request(app)
      .patch(`/api/auth/residents/${user2?.id}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "APPROVED" });
    const user2Login = await request(app)
      .post("/api/auth/login")
      .send({ username: user2Payload.username, password: user2Payload.password });
    const user2CookieHeader = user2Login.get("Set-Cookie");
    if (!user2CookieHeader) throw new Error("입주민2 쿠키 없음");
    user2Cookie = Array.isArray(user2CookieHeader) ? user2CookieHeader : [user2CookieHeader];

    // COMPLAINT 게시판 ID 가져오기
    const apartment = await prisma.apartment.findFirst({
      where: { name: adminPayload.apartmentName },
      include: { boards: true },
    });
    const complaintBoard = apartment?.boards.find((b) => b.type === "COMPLAINT");
    if (!complaintBoard) throw new Error("COMPLAINT 게시판 없음");
    boardId = complaintBoard.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  // ────────────────────────────────────────────
  // POST /api/complaints — 민원 등록
  // ────────────────────────────────────────────
  describe("POST /api/complaints — 민원 등록", () => {
    it("입주민이 민원을 정상적으로 등록해야 한다", async () => {
      const res = await request(app).post("/api/complaints").set("Cookie", userCookie).send({
        title: "층간소음 민원",
        content: "위층에서 너무 시끄럽습니다.",
        isPublic: true,
        boardId,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "층간소음 민원",
        content: "위층에서 너무 시끄럽습니다.",
        isPublic: true,
      });

      createdComplaintId = res.body.id;
    });

    it("인증 토큰 없이 민원 등록 시 401을 반환해야 한다", async () => {
      const res = await request(app)
        .post("/api/complaints")
        .send({ title: "테스트", content: "내용", isPublic: true, boardId });

      expect(res.status).toBe(401);
    });

    it("title이 없으면 400을 반환해야 한다", async () => {
      const res = await request(app)
        .post("/api/complaints")
        .set("Cookie", userCookie)
        .send({ content: "내용", isPublic: true, boardId });

      expect(res.status).toBe(400);
    });

    it("content가 없으면 400을 반환해야 한다", async () => {
      const res = await request(app)
        .post("/api/complaints")
        .set("Cookie", userCookie)
        .send({ title: "제목", isPublic: true, boardId });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────────
  // GET /api/complaints — 민원 목록 조회
  // ────────────────────────────────────────────
  describe("GET /api/complaints — 민원 목록 조회", () => {
    it("관리자는 전체 민원 목록을 조회해야 한다", async () => {
      const res = await request(app).get("/api/complaints").set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("complaints");
      expect(res.body).toHaveProperty("totalCount");
      expect(Array.isArray(res.body.complaints)).toBe(true);
    });

    it("입주민은 공개 민원과 본인 민원만 조회해야 한다", async () => {
      // 비공개 민원 생성
      await request(app)
        .post("/api/complaints")
        .set("Cookie", user2Cookie)
        .send({ title: "비공개 민원", content: "비공개입니다.", isPublic: false, boardId });

      const res = await request(app).get("/api/complaints").set("Cookie", userCookie);

      expect(res.status).toBe(200);
      // 비공개 민원이 다른 입주민에게 보이지 않아야 함
      const privateComplaints = res.body.complaints.filter(
        (c: any) => !c.isPublic && c.writerName === user2Payload.name,
      );
      expect(privateComplaints).toHaveLength(0);
    });

    it("인증 토큰 없이 조회 시 401을 반환해야 한다", async () => {
      const res = await request(app).get("/api/complaints");
      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // GET /api/complaints/:complaintId — 민원 상세 조회
  // ────────────────────────────────────────────
  describe("GET /api/complaints/:complaintId — 민원 상세 조회", () => {
    it("공개 민원을 정상적으로 조회해야 한다", async () => {
      const res = await request(app).get(`/api/complaints/${createdComplaintId}`).set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        complaintId: createdComplaintId,
        title: "층간소음 민원",
      });
    });

    it("조회 시 viewsCount가 증가해야 한다", async () => {
      const res1 = await request(app).get(`/api/complaints/${createdComplaintId}`).set("Cookie", userCookie);
      const res2 = await request(app).get(`/api/complaints/${createdComplaintId}`).set("Cookie", userCookie);

      expect(res2.body.viewsCount).toBeGreaterThan(res1.body.viewsCount);
    });

    it("비공개 민원을 다른 입주민이 조회하면 403을 반환해야 한다", async () => {
      // 비공개 민원 생성
      const createRes = await request(app)
        .post("/api/complaints")
        .set("Cookie", userCookie)
        .send({ title: "비공개", content: "비공개 민원", isPublic: false, boardId });

      const privateComplaintId = createRes.body.id;

      const res = await request(app).get(`/api/complaints/${privateComplaintId}`).set("Cookie", user2Cookie);

      expect(res.status).toBe(403);
    });

    it("관리자는 비공개 민원도 조회할 수 있어야 한다", async () => {
      const createRes = await request(app)
        .post("/api/complaints")
        .set("Cookie", userCookie)
        .send({ title: "비공개2", content: "비공개 민원2", isPublic: false, boardId });

      const privateComplaintId = createRes.body.id;

      const res = await request(app).get(`/api/complaints/${privateComplaintId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
    });

    it("존재하지 않는 민원 조회 시 404를 반환해야 한다", async () => {
      const res = await request(app).get("/api/complaints/non-existent-id").set("Cookie", userCookie);

      expect(res.status).toBe(404);
    });
  });

  // ────────────────────────────────────────────
  // PATCH /api/complaints/:complaintId — 민원 수정
  // ────────────────────────────────────────────
  describe("PATCH /api/complaints/:complaintId — 민원 수정", () => {
    it("본인이 작성한 PENDING 상태 민원을 수정해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}`)
        .set("Cookie", userCookie)
        .send({ title: "수정된 제목", content: "수정된 내용", isPublic: false });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        title: "수정된 제목",
        content: "수정된 내용",
        isPublic: false,
      });
    });

    it("다른 입주민의 민원을 수정하면 403을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}`)
        .set("Cookie", user2Cookie)
        .send({ title: "수정 시도", content: "수정 시도", isPublic: true });

      expect(res.status).toBe(403);
    });

    it("존재하지 않는 민원 수정 시 404를 반환해야 한다", async () => {
      const res = await request(app)
        .patch("/api/complaints/non-existent-id")
        .set("Cookie", userCookie)
        .send({ title: "제목", content: "내용", isPublic: true });

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 수정 시 401을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}`)
        .send({ title: "제목", content: "내용", isPublic: true });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // PATCH /api/complaints/:complaintId/status — 상태 변경
  // ────────────────────────────────────────────
  describe("PATCH /api/complaints/:complaintId/status — 상태 변경", () => {
    it("관리자가 민원 상태를 IN_PROGRESS로 변경해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("민원 상태가 변경되었습니다.");
    });

    it("상태가 IN_PROGRESS인 민원은 입주민이 수정할 수 없어야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}`)
        .set("Cookie", userCookie)
        .send({ title: "수정 시도", content: "수정 시도", isPublic: true });

      expect(res.status).toBe(400);
    });

    it("관리자가 민원 상태를 RESOLVED로 변경해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "RESOLVED" });

      expect(res.status).toBe(200);
    });

    it("입주민이 상태 변경 시도하면 403을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}/status`)
        .set("Cookie", userCookie)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(403);
    });

    it("유효하지 않은 status 값이면 400을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "INVALID_STATUS" });

      expect(res.status).toBe(400);
    });

    it("인증 토큰 없이 상태 변경 시 401을 반환해야 한다", async () => {
      const res = await request(app)
        .patch(`/api/complaints/${createdComplaintId}/status`)
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // DELETE /api/complaints/:complaintId — 민원 삭제
  // ────────────────────────────────────────────
  describe("DELETE /api/complaints/:complaintId — 민원 삭제", () => {
    let deletableComplaintId: string;

    beforeEach(async () => {
      // 삭제 테스트용 민원 생성
      const res = await request(app)
        .post("/api/complaints")
        .set("Cookie", userCookie)
        .send({ title: "삭제할 민원", content: "삭제 테스트", isPublic: true, boardId });
      deletableComplaintId = res.body.id;
    });

    it("본인이 작성한 PENDING 상태 민원을 삭제해야 한다", async () => {
      const res = await request(app).delete(`/api/complaints/${deletableComplaintId}`).set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("정상적으로 삭제 처리되었습니다.");
    });

    it("다른 입주민의 민원을 삭제하면 403을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/complaints/${deletableComplaintId}`).set("Cookie", user2Cookie);

      expect(res.status).toBe(403);
    });

    it("관리자는 다른 사람의 민원도 삭제할 수 있어야 한다", async () => {
      const res = await request(app).delete(`/api/complaints/${deletableComplaintId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
    });

    it("존재하지 않는 민원 삭제 시 404를 반환해야 한다", async () => {
      const res = await request(app).delete("/api/complaints/non-existent-id").set("Cookie", userCookie);

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 삭제 시 401을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/complaints/${deletableComplaintId}`);

      expect(res.status).toBe(401);
    });
  });
});
