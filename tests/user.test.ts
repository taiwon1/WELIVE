import { jest } from "@jest/globals";
import request from "supertest";
import app from "../src/app";
import prisma, { pool } from "../src/lib/prisma";
import bcrypt from "bcrypt";
import { StorageService } from "../src/services/s3.service";

describe("User 도메인 통합 테스트", () => {
  let userCookie: string[];
  let testUserId: string;

  let uploadSpy: any;

  const testUser = {
    username: "usertest01",
    password: "password123!",
    name: "유저테스트",
    email: "user@test.com",
    contact: "010-9999-8888",
    apartmentName: "그린아파트 1단지",
  };

  beforeAll(async () => {
    uploadSpy = jest.spyOn(StorageService.prototype, "uploadFile");
    uploadSpy.mockResolvedValue("https://fake-s3-url.com/profile.png");

    const deleteSpy = jest.spyOn(StorageService.prototype, "deleteFile");
    deleteSpy.mockResolvedValue();

    const transactions = [
      prisma.$executeRaw`TRUNCATE TABLE "RefreshToken" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Board" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "Apartment" CASCADE;`,
      prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE;`,
    ];

    try {
      await prisma.$transaction(transactions);
    } catch (error) {
      console.error("초기화 실패:", error);
    }

    const adminUsername = "test_admin_unique";

    const testApartment = await prisma.apartment.create({
      data: {
        name: testUser.apartmentName,
        address: "경상북도 구미시 송정동 123",
        officeNumber: "0541234567",
        description: "테스트용 아파트",
        startComplexNumber: "1",
        endComplexNumber: "10",
        startDongNumber: "101",
        endDongNumber: "110",
        startFloorNumber: "1",
        endFloorNumber: "20",
        startHoNumber: "1",
        endHoNumber: "4",
      },
    });

    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        password: await bcrypt.hash("password123!", 10),
        name: "아파트관리자",
        email: "admin@test.com",
        contact: "010-1111-2222",
        role: "ADMIN",
        joinStatus: "APPROVED",
        apartmentId: testApartment.id,
      },
    });

    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const user = await prisma.user.create({
      data: {
        username: testUser.username,
        password: hashedPassword,
        name: testUser.name,
        email: testUser.email,
        contact: testUser.contact,
        role: "USER",
        joinStatus: "APPROVED",
      },
    });
    testUserId = user.id;

    const loginRes = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });

    const cookieHeader = loginRes.get("Set-Cookie");
    if (!cookieHeader) throw new Error("로그인 실패로 쿠키를 획득하지 못했습니다.");
    userCookie = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

  describe("GET /api/users/me (session restore)", () => {
    it("성공: 현재 로그인 사용자의 공개 프로필을 반환해야 한다", async () => {
      const res = await request(app).get("/api/users/me").set("Cookie", userCookie);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: testUserId,
        username: testUser.username,
        email: testUser.email,
        role: "USER",
        joinStatus: "APPROVED",
      });
      expect(res.body).not.toHaveProperty("password");
    });

    it("실패: 로그인하지 않은 요청은 401을 반환해야 한다", async () => {
      const res = await request(app).get("/api/users/me");
      expect(res.status).toBe(401);
    });

    it("실패: 기존 토큰이 있어도 비활성 계정은 세션을 복구하지 않아야 한다", async () => {
      await prisma.user.update({ where: { id: testUserId }, data: { isActive: false } });
      const res = await request(app).get("/api/users/me").set("Cookie", userCookie);
      await prisma.user.update({ where: { id: testUserId }, data: { isActive: true } });

      expect(res.status).toBe(401);
    });
  });

  /**
   * PATCH /api/users/me (프로필 수정 테스트)
   */
  describe("PATCH /api/users/me (updateProfile)", () => {
    it("성공: 프로필 이미지와 비밀번호를 동시에 수정할 수 있어야 한다", async () => {
      const res = await request(app)
        .patch("/api/users/me")
        .set("Cookie", userCookie)
        .attach("file", Buffer.from("fake-image-content"), "profile.png")
        .field("currentPassword", testUser.password)
        .field("newPassword", "newPassword789!");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("imageUrl");

      const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
      const isMatch = await bcrypt.compare("newPassword789!", updatedUser!.password);
      expect(isMatch).toBe(true);
    });

    it("실패: 현재 비밀번호가 틀리면 400 에러를 반환해야 한다", async () => {
      const res = await request(app).patch("/api/users/me").set("Cookie", userCookie).send({
        currentPassword: "wrong_password",
        newPassword: "anyPassword123!",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("현재 비밀번호가 일치하지 않습니다.");
    });

    it("실패: 아무 데이터도 보내지 않으면 400 에러를 반환해야 한다", async () => {
      const res = await request(app).patch("/api/users/me").set("Cookie", userCookie);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("데이터 형식이 올바르지 않습니다. 필드: []");
    });
  });

  /**
   * PATCH /api/users/password (비밀번호 단독 변경 테스트)
   */
  describe("PATCH /api/users/password (changePassword)", () => {
    it("성공: 비밀번호 변경 후 기존 세션(RefreshToken)이 모두 삭제되어야 한다", async () => {
      // 가짜 리프레시 토큰 생성
      await prisma.refreshToken.create({
        data: {
          userId: testUserId,
          token: "dummy-refresh-token",
          expiresAt: new Date(Date.now() + 1000 * 3600),
        },
      });

      const res = await request(app).patch("/api/users/password").set("Cookie", userCookie).send({
        currentPassword: "newPassword789!", // 이전 테스트에서 바뀐 비번
        newPassword: "finalPassword!@#",
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("비밀번호가 변경되었습니다");

      // DB 확인: 리프레시 토큰이 모두 날아갔는지 확인
      const tokens = await prisma.refreshToken.findMany({
        where: { userId: testUserId },
      });
      expect(tokens.length).toBe(0);
    });

    it("실패: 기존 비밀번호와 동일한 새 비밀번호 설정 시 400 에러", async () => {
      const res = await request(app).patch("/api/users/password").set("Cookie", userCookie).send({
        currentPassword: "finalPassword!@#",
        newPassword: "finalPassword!@#",
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("새 비밀번호는 기존 비밀번호와 다르게 설정해야 합니다.");
    });
  });

  describe("권한 테스트", () => {
    it("로그인하지 않은 경우 401 에러를 반환해야 한다", async () => {
      const res = await request(app).patch("/api/users/me").send({ name: "unauthorized" });
      expect(res.status).toBe(401);
    });
  });
});
