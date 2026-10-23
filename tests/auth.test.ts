import { jest } from "@jest/globals";

jest.mock("../src/routes/upload.route", () => {
  const express = require("express");
  const router = express.Router();
  return router; // 빈 라우터를 반환하여 내부의 S3 검증 로직 실행을 차단
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

const payload = {
  username: "superadmin",
  password: "password123!",
  name: "최고관리자",
  contact: "01000000000",
  email: "super@test.com",
  joinStatus: "APPROVED",
  role: "SUPER_ADMIN",
};

const baseAdminPayload = {
  password: "password123!",
  passwordConfirm: "password123!",
  name: "관리자",
  role: "ADMIN" as const,
  description: "테스트용 아파트 관리자입니다.",
  startComplexNumber: "1",
  endComplexNumber: "10",
  startDongNumber: "101",
  endDongNumber: "110",
  startFloorNumber: "1",
  endFloorNumber: "20",
  startHoNumber: "1",
  endHoNumber: "4",
  apartmentAddress: "경상북도 구미시 송정동 123",
  apartmentManagementNumber: "0541234567",
};

const baseUserPayload = {
  name: "유저",
  password: "password123!",
  role: "USER",
  apartmentName: "그린아파트 1단지",
};

describe("Auth 도메인 통합 테스트", () => {
  beforeAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.notice.deleteMany();
    await prisma.board.deleteMany();
    await prisma.apartment.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
    // await db.end();
  });

  describe("초기 최고관리자 생성과 공개 가입 차단", () => {
    const service = new AuthService();
    const input = { ...payload, role: "SUPER_ADMIN" as const, joinStatus: "APPROVED" as const };
    it("공개 HTTP 요청으로 최고관리자를 생성할 수 없다", async () => {
      const res = await request(app).post("/api/auth/signup/super-admin").send(payload);
      expect([401, 404]).toContain(res.status);
      expect(await prisma.user.count({ where: { username: payload.username } })).toBe(0);
    });
    it("서버 초기 생성은 비밀번호를 노출하지 않는다", async () => {
      const user = await service.createSuperAdmin(input);
      expect(user).not.toHaveProperty("password");
      expect(user).toMatchObject({ role: "SUPER_ADMIN", joinStatus: "APPROVED" });
    });
    it("중복 아이디를 거절한다", async () => {
      await expect(service.createSuperAdmin(input)).rejects.toThrow("이미 사용 중인 아이디입니다.");
    });
    it("중복 이메일을 거절한다", async () => {
      await expect(service.createSuperAdmin({ ...input, username: "newadmin", contact: "01000002222" }))
        .rejects.toThrow("이미 사용 중인 이메일입니다.");
    });
    it("중복 연락처를 거절한다", async () => {
      await expect(service.createSuperAdmin({ ...input, username: "newadmin", email: "new@test.com" }))
        .rejects.toThrow("이미 등록된 연락처입니다.");
    });
  });

  let adminIds: string[] = [];
  let userIds: string[] = [];
  let superAdminCookie: string[];
  let adminCookie: string[];

  describe("POST /api/auth/signup/admin", () => {
    it("어드민 3명이 가입 대기 상태(PENDING)로 생성되어야 한다", async () => {
      for (const i of [1, 2, 3]) {
        const res = await request(app)
          .post("/api/auth/signup/admin") // Route 경로 확인 필요
          .send({
            ...baseAdminPayload,
            username: `admin_user_${i}`,
            email: `admin${i}@test.com`,
            contact: `0100000000${i}`,
            apartmentName: `그린아파트 ${i}단지`,
          });

        expect(res.status).toBe(201);
        expect(res.body).not.toHaveProperty("password");
        expect(res.body).toMatchObject({
          role: "ADMIN",
          joinStatus: "PENDING",
        });

        adminIds.push(res.body.id);
      }
      const userCount = await prisma.user.count({
        where: {
          role: "ADMIN",
          joinStatus: "PENDING",
        },
      });
      expect(userCount).toBe(3);
    });

    describe("Signup Transaction - 롤백 검증", () => {
      it("아파트 정보 생성 중 에러가 발생하면 유저 계정도 생성되지 않아야 한다", async () => {
        // 일부러 잘못된 데이터(예: 필수 필드 누락 등)를 보내거나
        // 서비스 로직에서 트랜잭션 내부 에러를 유도하는 시나리오
        const incompleteData = {
          username: "fail_user",
          password: "password123!",
          role: "ADMIN",
        };

        const res = await request(app).post("/api/auth/signup/admin").send(incompleteData);

        expect(res.status).not.toBe(201);

        // DB 확인: 유저가 생성되어 있으면 안 됨
        const user = await prisma.user.findUnique({ where: { username: "fail_user" } });
        expect(user).toBeNull();
      });
    });
  });

  describe("POST /api/auth/login - super-admin", () => {
    it("super-admin 로그인이 성공하고 쿠키가 발급되어야 한다.", async () => {
      const loginPayload = {
        username: "superadmin",
        password: "password123!",
      };

      const res = await request(app).post("/api/auth/login").send(loginPayload);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toMatchObject({
        username: "superadmin",
        name: "최고관리자",
        contact: "01000000000",
        email: "super@test.com",
        joinStatus: "APPROVED",
        role: "SUPER_ADMIN",
      });
      const cookieHeader = res.get("Set-Cookie");
      if (!cookieHeader) throw new Error("Cookie not found");
      superAdminCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
    });
  });

  describe("PATCH /api/auth/admins/:adminId/status", () => {
    it("super-admin은 admin의 가입을 승인할 수 있고 아파트 상태도 APPROVED로 변경되어야 한다.", async () => {
      const targetId = adminIds[0];
      const res = await request(app)
        .patch(`/api/auth/admins/${targetId}/status`)
        .set("Cookie", superAdminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetId! },
        include: { managedApartment: true },
      });
      expect(updatedUser?.joinStatus).toBe("APPROVED");
      expect(updatedUser?.managedApartment?.apartmentStatus).toBe("APPROVED");
    });
  });

  describe("PATCH /api/auth/admins/status", () => {
    it("super-admin은 PENDING 상태인 어드민을 전부 가입 승인할 수 있고 해당 아파트들도 APPROVED로 변경되어야 한다.", async () => {
      const pendingCountBefore = await prisma.user.count({
        where: { role: "ADMIN", joinStatus: "PENDING" },
      });
      expect(pendingCountBefore).toBeGreaterThan(0);

      const res = await request(app)
        .patch("/api/auth/admins/status")
        .set("Cookie", superAdminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const approvedAdmins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        include: { managedApartment: true },
      });

      approvedAdmins.forEach((admin) => {
        expect(admin.joinStatus).toBe("APPROVED");
        if (admin.managedApartment) {
          expect(admin.managedApartment.apartmentStatus).toBe("APPROVED");
        }
      });
    });
  });

  describe("Data Cleanup - REJECTED 데이터 삭제", () => {
    it("SUPER_ADMIN은 거절된(REJECTED) 모든 어드민과 아파트를 일괄 삭제할 수 있다", async () => {
      // 테스트를 위해 거절될 어드민 하나를 추가로 생성
      const rejectAdminPayload = {
        ...baseAdminPayload,
        username: "reject_admin",
        email: "reject@test.com",
        contact: "01099998888",
        apartmentName: "거절 아파트",
      };

      const rejectRes = await request(app).post("/api/auth/signup/admin").send(rejectAdminPayload);

      await request(app)
        .patch(`/api/auth/admins/${rejectRes.body.id}/status`)
        .set("Cookie", superAdminCookie)
        .send({ status: "REJECTED" });

      // 1. 거절된 어드민 셋업 (가입 승인 테스트 이후 status를 REJECTED로 변경)
      // 2. adminClean API 호출 (슈퍼어드민 쿠키 필요)
      const res = await request(app).post("/api/auth/cleanup").set("Cookie", superAdminCookie);

      expect(res.status).toBe(200);

      // 3. 실제로 삭제되었는지 쿼리로 확인
      const rejectedCount = await prisma.user.count({
        where: { role: "ADMIN", joinStatus: "REJECTED" },
      });
      expect(rejectedCount).toBe(0);
    });
  });

  describe("PATCH /api/auth/admins/:adminId", () => {
    it("슈퍼어드민은 어드민 정보를 수정할 수 있어야 한다.", async () => {
      const targetAdminId = adminIds[adminIds.length - 1];
      const updatePayload = {
        contact: "01099993333",
        name: "수정된 어드민",
        email: "update@test.com",
      };

      const res = await request(app)
        .patch(`/api/auth/admins/${targetAdminId}`)
        .set("Cookie", superAdminCookie)
        .send(updatePayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("작업이 성공적으로 완료되었습니다.");

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetAdminId! },
      });

      expect(updatedUser?.name).toBe(updatePayload.name);
      expect(updatedUser?.contact).toBe(updatePayload.contact);
      expect(updatedUser?.email).toBe(updatePayload.email);
    });

    it("슈퍼어드민은 어드민 아파트 기본 정보를 변경할 수 있어야 한다", async () => {
      const targetAdminId = adminIds[adminIds.length - 1];
      const apartmentUpdatePayload = {
        description: "아파트 업데이트 테스트",
        apartmentName: "업데이트 아파트",
        apartmentManagementNumber: "023545999",
      };

      const res = await request(app)
        .patch(`/api/auth/admins/${targetAdminId}`)
        .set("Cookie", superAdminCookie)
        .send(apartmentUpdatePayload);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("작업이 성공적으로 완료되었습니다.");

      const userWithApart = await prisma.user.findUnique({
        where: { id: targetAdminId! },
        select: { managedApartment: true },
      });
      const updateApart = userWithApart?.managedApartment;

      expect(updateApart?.description).toBe("아파트 업데이트 테스트");
      expect(updateApart?.name).toBe("업데이트 아파트");
      expect(updateApart?.officeNumber).toBe("023545999");
    });
  });

  describe("POST /api/auth/signup", () => {
    it("유저 3명이 가입 대기(PENDING)상태로 생성되어야 한다.", async () => {
      for (const i of [1, 2, 3]) {
        const res = await request(app)
          .post("/api/auth/signup") // Route 경로 확인 필요
          .send({
            ...baseUserPayload,
            username: `user_${i}`,
            email: `user${i}@test.com`,
            contact: `010000000${i}0`,
            apartmentDong: `10${i}`,
            apartmentHo: `${i}`,
            apartmentName: `그린아파트 1단지`, // 1번 관리자의 아파트(이름 변경되지 않음)로 통일
          });

        expect(res.status).toBe(201);
        expect(res.body).not.toHaveProperty("password");
        expect(res.body).toMatchObject({
          role: "USER",
          joinStatus: "PENDING",
        });
        userIds.push(res.body.id);
      }
      const userCount = await prisma.user.count({
        where: {
          role: "USER",
          joinStatus: "PENDING",
        },
      });
      expect(userCount).toBe(3);
    });

    it("등록되어 있지 않는 아파트로 회원가입 시도시 404 에러 반환", async () => {
      const userPayload = {
        username: "bill3645",
        password: "eF8bqIjfxfAHlmx",
        contact: "01049513609",
        name: "오지영",
        email: "era_king@hotmail.com",
        role: "USER",
        apartmentName: "도훈아파트",
        apartmentDong: "547",
        apartmentHo: "276",
      };

      const res = await request(app).post("/api/auth/signup").send(userPayload);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("해당 아파트가 존재하지 않습니다.");
    });
  });

  describe("POST /api/auth/login - admin", () => {
    it("admin 로그인에 성공하고 쿠키가 발급되어야 한다", async () => {
      const adminLoginPayload = {
        username: "admin_user_1",
        password: "password123!",
      };

      const res = await request(app).post("/api/auth/login").send(adminLoginPayload);

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toMatchObject({
        username: "admin_user_1",
        name: "관리자",
        contact: "01000000001",
        email: "admin1@test.com",
        joinStatus: "APPROVED",
        role: "ADMIN",
      });

      const cookieHeader = res.get("Set-Cookie");
      if (!cookieHeader) throw new Error("Cookie not found");
      adminCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
      console.log("획득한 쿠키:", adminCookie);
    });
  });

  describe("PATCH /api/auth/residents/:residentId/status", () => {
    it("admin은 user의 가입을 승인할 수 있어야 한다.", async () => {
      const targetId = userIds[0];
      const res = await request(app)
        .patch(`/api/auth/residents/${targetId}/status`)
        .set("Cookie", adminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const updatedUser = await prisma.user.findUnique({
        where: { id: targetId! },
      });
      expect(updatedUser?.joinStatus).toBe("APPROVED");
    });
  });

  describe("PATCH /api/auth/residents/status", () => {
    it("admin은 PENDING 상태인 resident를 전부 가입 승인할 수 있어야 한다.", async () => {
      const pendingCountBefore = await prisma.user.count({
        where: { role: "USER", joinStatus: "PENDING" },
      });
      expect(pendingCountBefore).toBeGreaterThan(0);

      const res = await request(app)
        .patch("/api/auth/residents/status")
        .set("Cookie", adminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);

      const approvedResidents = await prisma.user.findMany({
        where: { role: "USER" },
      });

      approvedResidents.forEach((user) => {
        expect(user.joinStatus).toBe("APPROVED");
      });
    });

    it("주민 승인 API에 어드민 ID를 넣으면 400 에러를 반환해야 한다", async () => {
      // adminId를 가져옴
      const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } });

      const res = await request(app)
        .patch(`/api/auth/residents/${admin?.id}/status`)
        .set("Cookie", adminCookie) // 혹은 superAdminCookie
        .send({ status: "APPROVED" });

      // 서비스 로직의 validateAndUpdateStatus에서 걸러져야 함
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("해당 사용자의 상태를 변경할 수 없습니다");
    });
  });

  describe("권한 테스트 (Authorization)", () => {
    it("로그인하지 않은 사용자가 어드민 승인을 시도하면 401을 반환해야 한다", async () => {
      const res = await request(app).patch("/api/auth/admins/status").send({ status: "APPROVED" });

      expect(res.status).toBe(401);
    });

    it("admin이 다른 admin의 가입을 승인하려 하면 403을 반환해야 한다.", async () => {
      const res = await request(app)
        .patch("/api/auth/admins/status")
        .set("Cookie", adminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(403);
    });
  });

  describe("로그인 실패 테스트", () => {
    it("틀린 비밀번호로 로그인 시 401 에러를 반환해야 한다.", async () => {
      const res = await request(app).post("/api/auth/login").send({ username: "superadmin", password: "password12" });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("아이디 또는 비밀번호가 일치하지 않습니다.");
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("유효한 리프레시 토큰으로 엑세스 토큰을 재발급 받아야 한다.", async () => {
      const res = await request(app).post("/api/auth/refresh").set("Cookie", adminCookie);

      expect(res.status).toBe(200);

      const newCookies = res.get("Set-Cookie");
      expect(newCookies).toBeDefined();
      expect(newCookies?.some((c) => c.includes("accessToken"))).toBe(true);
    });
  });

  it("리프레시 토큰이 없거나 유효하지 않으면 401 에러를 반환해야 한다.", async () => {
    const res = await request(app).post("/api/auth/refresh").set("Cookie", ["refreshToken=invalid_token_here"]);

    expect(res.status).toBe(401);
  });

  describe("AuthService - 트랜잭션 및 상세 로직", () => {
    it("이미 승인된 유저를 중복 승인 요청해도 200을 반환해야 한다", async () => {
      const targetId = adminIds[0];
      const res = await request(app)
        .patch(`/api/auth/admins/${targetId}/status`)
        .set("Cookie", superAdminCookie)
        .send({ status: "APPROVED" });

      expect(res.status).toBe(200);
    });
  });

  describe("Token Security", () => {
    it("로그아웃된 리프레시 토큰으로 재발급 시도 시 401을 반환해야 한다", async () => {
      await request(app).post("/api/auth/logout").set("Cookie", adminCookie);

      const res = await request(app).post("/api/auth/refresh").set("Cookie", adminCookie);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe("유효하지 않거나 만료된 세션입니다.");
    });
  });

  describe("POST /api/auth/logout", () => {
    it("로그아웃을 진행하면 해당 유저의 리프레시 토큰이 삭제되어야 한다", async () => {
      const targetUser = { username: "superadmin", password: "password123!" };

      const loginRes = await request(app).post("/api/auth/login").send(targetUser);
      const currentCookie = loginRes.get("Set-Cookie");

      // 로그인한 유저의 정보를 가져옴
      const user = await prisma.user.findUnique({ where: { username: targetUser.username } });

      await request(app).post("/api/auth/logout").set("Cookie", currentCookie!);

      // 전체 토큰이 아니라 '이 유저'의 토큰만 0개인지 확인해야 함
      const userTokens = await prisma.refreshToken.findMany({
        where: { userId: user!.id },
      });

      expect(userTokens.length).toBe(0);
    });
  });

  it("로그아웃 후 리프레시 토큰으로 재발급 시도시 401을 반환해야 한다", async () => {
    //로그아웃 수행
    await request(app).post("/api/auth/logout").set("Cookie", superAdminCookie);

    //로그아웃된 쿠키(리프레시 토큰 포함)로 갱신 시도
    const res = await request(app).post("/api/auth/refresh").set("Cookie", superAdminCookie);

    expect(res.status).toBe(401);
  });
});
