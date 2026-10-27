import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateData } from "../middlewares/validation.middleware";
import {
  AdminStruct,
  LoginStruct,
  UpdateStatusStruct,
  UserStruct,
  UpdateAdminStruct,
  AdminIdStruct,
  ResidentIdStruct,
} from "../structs/auth.struct";

const authRouter = Router();
const authController = new AuthController();

// ==========================================
// - 인증 없이 접근 가능한 회원가입 및 로그인
// ==========================================

/** 일반 사용자 회원가입 */
authRouter.post("/signup", validateData(UserStruct, "body"), authController.createUser);

/** 아파트 관리자(Admin) 회원가입 */
authRouter.post("/signup/admin", validateData(AdminStruct, "body"), authController.createAdmin);

// 최고관리자는 서버의 bootstrap-admin 명령으로만 생성한다.

/** 로그인 및 인증 토큰 발급 */
authRouter.post("/login", validateData(LoginStruct, "body"), authController.login);

/** Access Token 재발급 (Refresh Token 기반) */
authRouter.post("/refresh", authController.refresh);

// ==========================================
// - 인증 필수 API (Protected Routes)
// - 모든 요청에 유효한 Access Token 필요
// ==========================================
authRouter.use(authMiddleware);

/** 로그아웃 (토큰 무효화) */
authRouter.post("/logout", authController.logout);

/** 거절 계정 관리(최고 관리자는 관리자 계정을, 관리자는 사용자 계정을 일괄 정리합니다. */
authRouter.post("/cleanup", authController.cleanup);

// ------------------------------------------
// [권한: SUPER_ADMIN] 아파트 관리자 승인 및 관리
// ------------------------------------------

/** 특정 관리자 승인 상태 변경 (승인/거절) */
authRouter.patch(
  "/admins/:adminId/status",
  validateData(UpdateStatusStruct, "body"),
  validateData(AdminIdStruct, "params"),
  authController.updateAdminStatus,
);

/** 모든 대기 중인 관리자 일괄 승인 상태 변경 */
authRouter.patch("/admins/status", validateData(UpdateStatusStruct, "body"), authController.bulkUpdateAdminStatus);

/** 특정 관리자 정보 수정 (아파트 정보 포함) */
authRouter.patch(
  "/admins/:adminId",
  validateData(UpdateAdminStruct, "body"),
  validateData(AdminIdStruct, "params"),
  authController.updateAdminInfo,
);

/**특정 관리자 삭제(관리하는 아파트 정보도 함께 삭제) */
authRouter.delete("/admins/:adminId", validateData(AdminIdStruct, "params"), authController.deleteAdmin);

// ------------------------------------------
// [권한: ADMIN] 입주민 승인 및 관리
// ------------------------------------------

/** 특정 입주민 승인 상태 변경 */
authRouter.patch(
  "/residents/:residentId/status",
  validateData(UpdateStatusStruct, "body"),
  validateData(ResidentIdStruct, "params"),
  authController.updateResidentStatus,
);

/** 해당 단지의 대기 중인 입주민 일괄 승인 상태 변경 */
authRouter.patch(
  "/residents/status",
  validateData(UpdateStatusStruct, "body"),
  authController.bulkUpdateResidentStatus,
);

export default authRouter;
