import { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import {
  AdminId,
  ResidentId,
  CreateUserType,
  CreateAdmin,
  CreateSuperAdmin,
  LoginData,
  UpdateStatus,
  UpdateAdminInfo,
} from "../structs/auth.struct";
import { ForbiddenError, UnauthorizedError } from "../errors/errors";
import { ReplicationRuleStatus } from "@aws-sdk/client-s3";

export class AuthController {
  private authService = new AuthService();

  /**
   * 일반 사용자 회원가입
   * @route POST /api/auth/signup
   */
  createUser = async (req: Request<{}, {}, CreateUserType>, res: Response) => {
    const createUserData = req.body;

    const user = await this.authService.createUser(createUserData);

    res.status(201).json(user);
  };

  /**
   * 아파트 관리자 회원가입
   * @route POST /api/auth/signup/admin
   */
  createAdmin = async (req: Request<{}, {}, CreateAdmin>, res: Response) => {
    const createAdminDto = req.body;
    const admin = await this.authService.createAdmin(createAdminDto);

    res.status(201).json(admin);
  };

  /**
   * 시스템 통합 관리자 회원가입
   * @route POST /api/auth/singup/super-admin
   */
  createSuperAdmin = async (req: Request<{}, {}, CreateSuperAdmin>, res: Response) => {
    const createSuperAdminDto = req.body;
    const superAdmin = await this.authService.createSuperAdmin(createSuperAdminDto);

    res.status(201).json(superAdmin);
  };

  /**
   * 사용자 로그인을 처리하고 인증 쿠키를 설정
   * @route POST /api/auth/login
   */
  login = async (req: Request<{}, {}, LoginData>, res: Response) => {
    const loginDto = req.body;
    const { user, accessToken, refreshToken } = await this.authService.login(loginDto);
    this.setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json(user);
  };

  private setAuthCookies = (res: Response, access: string, refresh: string) => {
    const isProduction = process.env.NODE_ENV === "production";
    const isTest = process.env.NODE_ENV === "test";

    const commonOptions = {
      httpOnly: true,
      secure: isProduction && !isTest,
      sameSite: isProduction ? ("strict" as const) : ("lax" as const),
      path: "/",
    };

    res.cookie("accessToken", access, {
      ...commonOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refresh, {
      ...commonOptions,
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });
  };

  /**
   * Refresh Token을 사용하여 Access Token을 갱신하고 새로운 Refresh Token을 발급
   * @route POST /api/auth/refresh
   */
  refresh = async (req: Request, res: Response) => {
    const token = req.cookies.refreshToken;

    if (!token) {
      throw new UnauthorizedError("인증 토큰이 없습니다.");
    }
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    this.setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({ message: "토큰이 성공적으로 갱신되었습니다." });
  };

  /**
   * 로그아웃을 처리하고 DB의 토큰 무효화 및 쿠키를 삭제
   * @route POST /api/auth/logout
   */
  logout = async (req: Request, res: Response) => {
    const userId = req.user.id;
    const refreshToken = req.cookies.refreshToken;
    await this.authService.logout(userId, refreshToken);

    // 쿠키 삭제
    res.clearCookie("accessToken", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });

    res.status(200).json({ message: "성공적으로 로그아웃 되었습니다." });
  };

  /**
   * 특정 관리자의 가입 승인 상태를 변경 (super-admin 전용)
   * @route PATCH /api/auth/admins/:adminId/status
   */
  updateAdminStatus = async (req: Request<AdminId, {}, UpdateStatus>, res: Response) => {
    this.checkPermission(req, "SUPER_ADMIN");

    const { adminId } = req.params;
    const { status } = req.body;
    const updateAdmin = await this.authService.updateAdminStatus(adminId, status);

    res.status(200).json(updateAdmin);
  };

  /**
   * 가입 승인을 대기 중인 모든 관리자의 가입 상태를 일괄 변경 (super-admin 전용)
   * @route PATCH /api/auth/admins/status
   */
  bulkUpdateAdminStatus = async (req: Request<{}, {}, UpdateStatus>, res: Response) => {
    this.checkPermission(req, "SUPER_ADMIN");

    const { status } = req.body;
    await this.authService.bulkUpdateAdminStatus(status);

    res.status(200).json({ message: "작업이 성공적으로 완료되었습니다." });
  };

  /**
   * 특정 주민의 가입 승인 상태를 변경 (admin 전용)
   * @route PATCH /api/auth/residents/:residentId/status
   */
  updateResidentStatus = async (req: Request<ResidentId, {}, UpdateStatus>, res: Response) => {
    this.checkPermission(req, "ADMIN");

    const { residentId } = req.params;
    const { status } = req.body;
    await this.authService.updateResidentStatus(req.user.id, residentId, status);

    res.status(200).json({ message: "작업이 성공적으로 완료되었습니다." });
  };

  /**
   * 해당 아파트의 모든 대기 중인 주민 가입 상태를 일괄 변경 (admin 전용)
   * @route PATCH /api/auth/residents/status
   */
  bulkUpdateResidentStatus = async (req: Request<{}, {}, UpdateStatus>, res: Response) => {
    this.checkPermission(req, "ADMIN");

    const userId = req.user.id;
    const { status } = req.body;
    await this.authService.bulkUpdateResidentStatus(userId, status);

    res.status(200).json({ message: "작업이 성공적으로 완료되었습니다." });
  };

  /**
   * 특정 관리자의 정보(아파트명 등)를 수정 (SUPER_ADMIN 전용)
   * @route PATCH /api/auth/admins/:adminId
   * @param req - AdminId 파라미터와 UpdateAdminInfo 바디를 포함한 객체
   */
  updateAdminInfo = async (req: Request<AdminId, {}, UpdateAdminInfo>, res: Response) => {
    this.checkPermission(req, "SUPER_ADMIN");

    const { adminId } = req.params;
    const updateData = req.body;

    await this.authService.updateAdminInfo(adminId, updateData);

    res.status(200).json({ message: "작업이 성공적으로 완료되었습니다." });
  };

  /**
   * 요청 사용자의 역할(Role)이 필요한 권한과 일치하는지 확인
   * @param req - Express Request 객체
   * @param requiredRole - 허용된 역할 (SUPER_ADMIN 또는 ADMIN)
   * @throws {ForbiddenError} 권한이 일치하지 않을 경우 발생
   * @private
   */
  private checkPermission(req: Request, requiredRole: "SUPER_ADMIN" | "ADMIN") {
    if (req.user.role !== requiredRole) {
      throw new ForbiddenError("권한이 없습니다.");
    }
  }

  /**
   * 특정 관리자 계정을 삭제 (SUPER_ADMIN 전용)
   * @route DELETE /api/auth/admins/:adminId
   * @param req - 삭제할 관리자의 AdminId를 포함한 객체
   */
  deleteAdmin = async (req: Request<AdminId>, res: Response) => {
    this.checkPermission(req, "SUPER_ADMIN");

    const { adminId } = req.params;
    await this.authService.deleteAdmin(adminId);

    res.status(204).end();
  };

  /**
   * 가입 거절된 계정 및 연관 데이터를 일괄 정리
   * - SUPER_ADMIN: 거절된 관리자 계정 및 해당 아파트 정보 삭제
   * - ADMIN: 본인 아파트의 거절된 주민 계정 삭제
   * @route POST /api/auth/cleanup
   */
  cleanup = async (req: Request, res: Response) => {
    const userRole = req.user.role;

    if (userRole === "SUPER_ADMIN") {
      await this.authService.adminClean();
    } else if (userRole === "ADMIN") {
      const adminId = req.user.id;
      await this.authService.residentClean(adminId);
    } else {
      throw new ForbiddenError("작업을 수행할 권한이 없습니다.");
    }

    res.status(200).json({ message: "작업이 성공적으로 완료되었습니다." });
  };
}
