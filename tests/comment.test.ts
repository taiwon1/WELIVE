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
// 테스트 데이터 셋업
// ────────────────────────────────────────────

const superAdminPayload = {
  username: "comment_superadmin",
  password: "password123!",
  name: "최고관리자",
  contact: "01099990000",
  email: "comment_super@test.com",
  joinStatus: "APPROVED",
  role: "SUPER_ADMIN",
};

const adminPayload = {
  username: "comment_admin",
  password: "password123!",
  passwordConfirm: "password123!",
  name: "관리자",
  contact: "01099990001",
  email: "comment_admin@test.com",
  role: "ADMIN",
  description: "테스트용 아파트 관리자입니다.",
  apartmentName: "댓글테스트아파트",
  apartmentAddress: "서울시 강남구 테스트동 123",
  apartmentManagementNumber: "0212345678",
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
  username: "comment_user",
  password: "password123!",
  name: "입주민",
  contact: "01099990002",
  email: "comment_user@test.com",
  role: "USER",
  apartmentName: "댓글테스트아파트",
  apartmentDong: "101",
  apartmentHo: "1",
};

const user2Payload = {
  username: "comment_user2",
  password: "password123!",
  name: "입주민2",
  contact: "01099990003",
  email: "comment_user2@test.com",
  role: "USER",
  apartmentName: "댓글테스트아파트",
  apartmentDong: "101",
  apartmentHo: "2",
};

// ────────────────────────────────────────────

describe("Comment 도메인 통합 테스트", () => {
  let superAdminCookie: string[];
  let adminCookie: string[];
  let userCookie: string[];
  let user2Cookie: string[];
  let boardId: string;
  let complaintId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    // DB 초기화 - comment 테스트 관련 데이터만 정리
    await prisma.comment.deleteMany({
      where: { author: { username: { startsWith: "comment_" } } },
    });
    await prisma.refreshToken.deleteMany({
      where: { user: { username: { startsWith: "comment_" } } },
    });
    await prisma.user.deleteMany({
      where: { username: { startsWith: "comment_" } },
    });
    await prisma.board.deleteMany({
      where: { apartment: { name: "댓글테스트아파트" } },
    });
    await prisma.apartment.deleteMany({
      where: { name: "댓글테스트아파트" },
    });

    // 슈퍼어드민 생성
    await new AuthService().createSuperAdmin({ ...superAdminPayload, role: "SUPER_ADMIN", joinStatus: "APPROVED" });

    // 슈퍼어드민 로그인
    const superAdminLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: superAdminPayload.username, password: superAdminPayload.password });
    const superAdminCookieHeader = superAdminLogin.get("Set-Cookie");
    if (!superAdminCookieHeader) throw new Error("슈퍼어드민 쿠키 없음");
    superAdminCookie = Array.isArray(superAdminCookieHeader) ? superAdminCookieHeader : [superAdminCookieHeader];

    // 관리자 회원가입
    await request(app).post("/api/auth/signup/admin").send(adminPayload);

    // 관리자 승인
    const admin = await prisma.user.findUnique({ where: { username: adminPayload.username } });
    await request(app)
      .patch(`/api/auth/admins/${admin?.id}/status`)
      .set("Cookie", superAdminCookie)
      .send({ status: "APPROVED" });

    // 관리자 로그인
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: adminPayload.username, password: adminPayload.password });
    const adminCookieHeader = adminLogin.get("Set-Cookie");
    if (!adminCookieHeader) throw new Error("관리자 쿠키 없음");
    adminCookie = Array.isArray(adminCookieHeader) ? adminCookieHeader : [adminCookieHeader];

    // 입주민1 회원가입 → 승인
    await request(app).post("/api/auth/signup").send(userPayload);
    const user = await prisma.user.findUnique({ where: { username: userPayload.username } });
    await request(app)
      .patch(`/api/auth/residents/${user?.id}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "APPROVED" });

    // 입주민1 로그인
    const userLogin = await request(app)
      .post("/api/auth/login")
      .send({ username: userPayload.username, password: userPayload.password });
    const userCookieHeader = userLogin.get("Set-Cookie");
    if (!userCookieHeader) throw new Error("입주민 쿠키 없음");
    userCookie = Array.isArray(userCookieHeader) ? userCookieHeader : [userCookieHeader];

    // 입주민2 회원가입 → 승인
    await request(app).post("/api/auth/signup").send(user2Payload);
    const user2 = await prisma.user.findUnique({ where: { username: user2Payload.username } });
    await request(app)
      .patch(`/api/auth/residents/${user2?.id}/status`)
      .set("Cookie", adminCookie)
      .send({ status: "APPROVED" });

    // 입주민2 로그인
    const user2Login = await request(app)
      .post("/api/auth/login")
      .send({ username: user2Payload.username, password: user2Payload.password });
    const user2CookieHeader = user2Login.get("Set-Cookie");
    if (!user2CookieHeader) throw new Error("입주민2 쿠키 없음");
    user2Cookie = Array.isArray(user2CookieHeader) ? user2CookieHeader : [user2CookieHeader];

    // 테스트용 boardId 가져오기 (COMPLAINT 게시판)
    const apartment = await prisma.apartment.findFirst({
      where: { name: adminPayload.apartmentName },
      include: { boards: true },
    });
    const complaintBoard = apartment?.boards.find((b) => b.type === "COMPLAINT");
    if (!complaintBoard) throw new Error("COMPLAINT 게시판 없음");
    boardId = complaintBoard.id;

    // 댓글 테스트용 민원 생성
    const complaintRes = await request(app).post("/api/complaints").set("Cookie", userCookie).send({
      title: "댓글 테스트용 민원",
      content: "댓글 테스트를 위한 민원입니다.",
      isPublic: true,
      boardId,
    });
    if (complaintRes.status !== 201) throw new Error("민원 생성 실패");
    complaintId = complaintRes.body.id;
  });

  afterAll(async () => {
    await prisma.comment.deleteMany({
      where: { author: { username: { startsWith: "comment_" } } },
    });
    await prisma.$disconnect();
    await pool.end();
  });

  // ────────────────────────────────────────────
  // POST /api/comments — 댓글 생성
  // ────────────────────────────────────────────
  describe("POST /api/comments — 댓글 생성", () => {
    it("입주민이 댓글을 정상적으로 생성해야 한다", async () => {
      const res = await request(app).post("/api/comments").set("Cookie", userCookie).send({
        content: "테스트 댓글입니다.",
        boardType: "COMPLAINT",
        boardId: complaintId,
      });

      expect(res.status).toBe(201);
      expect(res.body.comment).toMatchObject({
        id: expect.any(String),
        userId: expect.any(String),
        writerName: userPayload.name,
        content: "테스트 댓글입니다.",
        board: {
          id: complaintId,
          boardType: "COMPLAINT",
        },
      });

      createdCommentId = res.body.comment.id;
    });

    it("관리자도 댓글을 생성할 수 있어야 한다", async () => {
      const res = await request(app).post("/api/comments").set("Cookie", adminCookie).send({
        content: "관리자 댓글입니다.",
        boardType: "COMPLAINT",
        boardId: complaintId,
      });

      expect(res.status).toBe(201);
      expect(res.body.comment.writerName).toBe(adminPayload.name);
    });

    it("인증 토큰 없이 댓글 생성 시 401을 반환해야 한다", async () => {
      const res = await request(app).post("/api/comments").send({
        content: "인증 없는 댓글",
        boardType: "COMPLAINT",
        boardId: complaintId,
      });

      expect(res.status).toBe(401);
    });

    it("content가 없으면 400을 반환해야 한다", async () => {
      const res = await request(app).post("/api/comments").set("Cookie", userCookie).send({
        boardType: "COMPLAINT",
        boardId: complaintId,
      });

      expect(res.status).toBe(400);
    });

    it("boardType이 없으면 400을 반환해야 한다", async () => {
      const res = await request(app).post("/api/comments").set("Cookie", userCookie).send({
        content: "boardType 없는 댓글",
        boardId: complaintId,
      });

      expect(res.status).toBe(400);
    });

    it("유효하지 않은 boardType이면 400을 반환해야 한다", async () => {
      const res = await request(app).post("/api/comments").set("Cookie", userCookie).send({
        content: "잘못된 boardType",
        boardType: "INVALID",
        boardId: complaintId,
      });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────────
  // PATCH /api/comments/:commentId — 댓글 수정
  // ────────────────────────────────────────────
  describe("PATCH /api/comments/:commentId — 댓글 수정", () => {
    it("본인이 작성한 댓글을 수정할 수 있어야 한다", async () => {
      const res = await request(app).patch(`/api/comments/${createdCommentId}`).set("Cookie", userCookie).send({
        content: "수정된 댓글입니다.",
      });

      expect(res.status).toBe(200);
      expect(res.body.comment).toMatchObject({
        id: createdCommentId,
        content: "수정된 댓글입니다.",
        board: {
          id: complaintId,
          boardType: "COMPLAINT",
        },
      });
    });

    it("다른 사람의 댓글을 수정하면 403을 반환해야 한다", async () => {
      const res = await request(app).patch(`/api/comments/${createdCommentId}`).set("Cookie", user2Cookie).send({
        content: "남의 댓글 수정 시도",
      });

      expect(res.status).toBe(403);
    });

    it("존재하지 않는 댓글 수정 시 404를 반환해야 한다", async () => {
      const res = await request(app).patch(`/api/comments/non-existent-id`).set("Cookie", userCookie).send({
        content: "없는 댓글 수정",
      });

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 댓글 수정 시 401을 반환해야 한다", async () => {
      const res = await request(app).patch(`/api/comments/${createdCommentId}`).send({
        content: "인증 없는 수정",
        boardType: "COMPLAINT",
        boardId: complaintId,
      });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────────
  // DELETE /api/comments/:commentId — 댓글 삭제
  // ────────────────────────────────────────────
  describe("DELETE /api/comments/:commentId — 댓글 삭제", () => {
    it("다른 입주민이 남의 댓글을 삭제하면 403을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/comments/${createdCommentId}`).set("Cookie", user2Cookie);

      expect(res.status).toBe(403);
    });

    it("관리자는 다른 사람의 댓글을 삭제할 수 있어야 한다", async () => {
      // 관리자용 댓글 새로 생성
      const createRes = await request(app).post("/api/comments").set("Cookie", userCookie).send({
        content: "관리자가 삭제할 댓글",
        boardType: "COMPLAINT",
        boardId: complaintId,
      });
      const targetCommentId = createRes.body.comment.id;

      const res = await request(app).delete(`/api/comments/${targetCommentId}`).set("Cookie", adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("정상적으로 삭제 처리되었습니다");
    });

    it("본인이 작성한 댓글을 삭제할 수 있어야 한다", async () => {
      const res = await request(app).delete(`/api/comments/${createdCommentId}`).set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("정상적으로 삭제 처리되었습니다");
    });

    it("이미 삭제된 댓글을 삭제하면 404를 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/comments/${createdCommentId}`).set("Cookie", userCookie);

      expect(res.status).toBe(404);
    });

    it("인증 토큰 없이 댓글 삭제 시 401을 반환해야 한다", async () => {
      const res = await request(app).delete(`/api/comments/${createdCommentId}`);

      expect(res.status).toBe(401);
    });
  });
});
