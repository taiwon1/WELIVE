import { CreateUserType, CreateAdmin, CreateSuperAdmin, LoginData, UpdateAdminInfo } from "../structs/auth.struct";
import { AuthRepo } from "../repositories/auth.repository";
import { ApartRepo } from "../repositories/apartment.repository";
import { ResidentsRepo } from "../repositories/residents.repository";
import { BadRequestError, NotFoundError, UnauthorizedError, ConflictError } from "../errors/errors";
import { getTenantActor } from "./tenant-access.service";
import { LoginResponseDto } from "../models/auth.model";
import { Status } from "../types/auth.type";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { verifyToken, expiresIn14Days } from "../utils/auth.utill";
import prisma from "../lib/prisma";
import { JoinStatus, Prisma } from "@prisma/client";

export class AuthService {
  private authRepo = new AuthRepo();
  private apartRepo = new ApartRepo();
  private residentsRepo = new ResidentsRepo();

  private async prepareRegistration(data: CreateUserType | CreateAdmin | CreateSuperAdmin) {
    const [existingUsername, existingEmail, existingContract] = await Promise.all([
      this.authRepo.findUniqueUser({ username: data.username }),
      this.authRepo.findUniqueUser({ email: data.email }),
      this.authRepo.findUniqueUser({ contact: data.contact }),
    ]);

    if (existingUsername) throw new ConflictError("이미 사용 중인 아이디입니다.");
    if (existingEmail) throw new ConflictError("이미 사용 중인 이메일입니다.");
    if (existingContract) throw new ConflictError("이미 등록된 연락처입니다.");

    const saltRound = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRound);

    return hashedPassword;
  }

  createUser = async (data: CreateUserType) => {
    const hashedPassword = await this.prepareRegistration(data);

    const apartmentId = await this.apartRepo.getApartmentId(data.apartmentName);
    if (!apartmentId) {
      throw new NotFoundError(`해당 아파트가 존재하지 않습니다.`);
    }

    return await prisma.$transaction(async (tx) => {
      const isAlreadyJoined = await this.residentsRepo.checkHouseholderjoined(
        apartmentId,
        data.apartmentDong,
        data.apartmentHo,
        tx,
      );
      if (isAlreadyJoined) {
        throw new ConflictError("이미 해당 호수에 가입된 세대주가 존재합니다.");
      }

      let resident = await this.residentsRepo.findByContact(data.contact, tx);
      if (resident && (
        resident.apartmentId !== apartmentId ||
        resident.name !== data.name ||
        resident.building !== data.apartmentDong ||
        resident.unitNumber !== data.apartmentHo ||
        resident.residenceStatus !== "RESIDENCE"
      )) {
        throw new ConflictError("입주민 등록 정보가 일치하지 않습니다.");
      }

      let joinStatus: "APPROVED" | "PENDING" = "PENDING";
      const isRegistered = true;

      if (resident) {
        joinStatus = "APPROVED";
        resident = await this.residentsRepo.updateIsRegistered(resident.id, isRegistered, tx);
      } else {
        resident = await this.residentsRepo.createResident(
          {
            apartmentId,
            building: data.apartmentDong,
            unitNumber: data.apartmentHo,
            contact: data.contact,
            name: data.name,
            isHouseholder: "HOUSEHOLDER",
            residenceStatus: "RESIDENCE",
          },
          apartmentId,
          isRegistered,
          tx,
        );
      }

      const user = await this.authRepo.createUser(
        {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          contact: data.contact,
          name: data.name,
          residentId: resident.id,
          role: "USER",
          joinStatus,
          apartmentName: data.apartmentName,
          apartmentDong: data.apartmentDong,
          apartmentHo: data.apartmentHo,
        },
        tx,
      );
      return user;
    });
  };

  createAdmin = async (data: CreateAdmin) => {
    const hashedPassword = await this.prepareRegistration(data);

    return await prisma.$transaction(async (tx) => {
      const apartment = await this.apartRepo.createApart(
        {
          name: data.apartmentName,
          address: data.apartmentAddress,
          officeNumber: data.apartmentManagementNumber,
          description: data.description,
          startComplexNumber: data.startComplexNumber,
          endComplexNumber: data.endComplexNumber,
          startDongNumber: data.startDongNumber,
          endDongNumber: data.endDongNumber,
          startFloorNumber: data.startFloorNumber,
          endFloorNumber: data.endFloorNumber,
          startHoNumber: data.startHoNumber,
          endHoNumber: data.endHoNumber,
        },
        tx,
      );

      const admin = await this.authRepo.createUser(
        {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          contact: data.contact,
          name: data.name,
          role: "ADMIN",
          joinStatus: "PENDING",
          apartmentId: apartment.id,
        },
        tx,
      );

      // 생성된 관리자(User)를 아파트의 admin(adminId)에 연결하여 참조 무결성 확보
      await this.apartRepo.updateApartment(apartment.id, { admin: { connect: { id: admin.id } } }, tx);

      return admin;
    });
  };

  createSuperAdmin = async (data: CreateSuperAdmin, tx?: Prisma.TransactionClient) => {
    const hashedPassword = await this.prepareRegistration(data);

    // Prisma 저장을 위해 DB 스키마에 없는 passwordConfirm 필드를 제거
    const superAdminData = data;

    const superAdmin = await this.authRepo.createUser({
      ...superAdminData,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      joinStatus: "APPROVED",
    }, tx);
    return superAdmin;
  };

  /**
   * 사용자 로그인을 처리하고 새로운 Access/Refresh 토큰 세트를 발급
   * @param data - 로그인 입력 데이터 (username, password)
   * @throws {UnauthorizedError} 아이디가 없거나 비밀번호가 틀린 경우, 또는 가입 승인 대기/거절 상태인 경우 발생
   */
  login = async (data: LoginData) => {
    const user = await this.authRepo.findByUsername(data.username);
    if (!user) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError("아이디 또는 비밀번호가 일치하지 않습니다.");
    }

    if (!user.isActive || (user.role === "USER" && user.resident?.residenceStatus !== "RESIDENCE")) {
      throw new UnauthorizedError("현재 이용할 수 없는 계정입니다. 관리자에게 문의해주세요.");
    }

    if (user.joinStatus === "PENDING") {
      throw new UnauthorizedError("관리자의 승인 대기 중인 계정입니다.");
    }

    if (user.joinStatus === "REJECTED") {
      throw new UnauthorizedError("관리자에 의해 가입이 거절된 계정입니다.");
    }

    let apartmentId: string | null = user.apartmentId || null;

    if (user.role === "ADMIN") {
      const managedApt = Array.isArray(user.managedApartment) ? user.managedApartment[0] : user.managedApartment;
      apartmentId = apartmentId || managedApt?.id || null;
    } else if (user.role === "USER") {
      apartmentId = apartmentId || user.resident?.apartmentId || null;
    }

    // 토큰 발급 및 기존 토큰 정리
    const { accessToken, refreshToken } = await this.rotateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
      apartmentId: apartmentId ?? undefined,
    });

    const userResponse = new LoginResponseDto(user);
    return { user: userResponse, accessToken, refreshToken };
  };

  /**
   * 유효한 Refresh 토큰을 확인하고 Access/Refresh 토큰을 재발급
   * @param token - 클라이언트로부터 전달받은 Refresh Token
   * @throws {UnauthorizedError} 토큰이 유효하지 않거나 만료된 경우 발생
   */
  refresh = async (token: string) => {
    // 토큰 유효성 검사
    await verifyToken(token, process.env.JWT_REFRESH_SECRET!);

    // DB에 저장된 토큰인지 확인 및 만료 여부 체크
    const savedToken = await this.authRepo.findRefreshToken(token);
    if (!savedToken || savedToken.expiresAt < new Date()) {
      throw new UnauthorizedError("유효하지 않거나 만료된 세션입니다.");
    }

    const user = savedToken.user;

    if (!user.isActive || user.joinStatus !== "APPROVED" ||
      (user.role === "USER" && user.resident?.residenceStatus !== "RESIDENCE")) {
      throw new UnauthorizedError("현재 이용할 수 없는 계정입니다. 관리자에게 문의해주세요.");
    }

    return await this.rotateTokens({
      ...user,
      apartmentId: (user.role === "USER" ? user.resident?.apartmentId : user.apartmentId) ?? undefined,
    });
  };

  /**
   * 특정 사용자의 리프레시 토큰을 DB에서 삭제하여 로그아웃 처리합니다.
   * @param userId - 로그아웃을 시도하는 유저 ID
   * @param refreshToken - 무효화할 특정 리프레시 토큰
   */
  logout = async (userId: string, refreshToken?: string): Promise<void> => {
    // refreshToken이 없는 경우, Prisma의 undefined 무시 현상으로 인한 전체 세션 삭제를 방지하고
    // 이미 세션이 없는 것과 같으므로 바로 종료합니다.
    if (!refreshToken) return;

    await this.authRepo.deleteRefreshTokens(userId, refreshToken);
  };

  /**
   * 관리자의 가입 승인 상태 변경 요청을 처리
   * @param adminId - 상태를 변경할 관리자의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  updateAdminStatus = async (adminId: string, status: Status) => {
    return await prisma.$transaction(async (tx) => {
      const admin = await this.authRepo.findById(adminId, tx);
      if (!admin) throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");
      if (admin.role !== "ADMIN") {
        throw new BadRequestError("해당 사용자의 상태를 변경할 수 없습니다.");
      }

      // 상태가 같더라도 User와 Apartment의 상태가 불일치(Out of sync)할 수 있으므로,
      // 조기 리턴을 제거하고 강제로 양쪽 테이블의 상태를 동기화(Update)시킵니다.

      const updateUser = await this.authRepo.updateUserStatus(adminId, status, tx);

      const apartmentId = admin.apartmentId;
      if (apartmentId) {
        await this.apartRepo.updateApartmentStatus(apartmentId, status, tx);
      }

      // 아파트 상태 변경 결과도 클라이언트에서 알 수 있도록 반환 데이터를 보완
      return { ...updateUser, apartmentStatus: apartmentId ? status : undefined };
    });
  };

  /**
   * 주민의 가입 승인 상태 변경 요청을 처리
   * @param residentId - 상태를 변경할 주민의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  updateResidentStatus = async (adminId: string, residentId: string, status: JoinStatus) => {
    const actor = await getTenantActor(adminId);
    if (!actor.isAdmin) throw new UnauthorizedError("관리자 권한이 필요합니다.");
    const user = await this.authRepo.findResidentUserById(residentId);

    if (!user) throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");
    if (user.role !== "USER") {
      throw new BadRequestError("해당 사용자의 상태를 변경할 수 없습니다.");
    }
    if (user.resident?.apartmentId !== actor.apartmentId) {
      throw new NotFoundError("해당 사용자를 찾을 수 없습니다.");
    }
    if (user.joinStatus === status) return;

    await this.authRepo.updateUserStatus(user.id, status);
  };

  /**
   * 가입 대기 중인 모든 관리자(ADMIN)의 상태를 일괄 변경
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   */
  bulkUpdateAdminStatus = async (status: Status) => {
    await prisma.$transaction(async (tx) => {
      const apartmentIds = await this.authRepo.getPendingAdminApartmentIds(tx);

      await this.authRepo.bulkUpdateAdminStatus(status, tx);
      if (apartmentIds.length > 0) {
        await this.apartRepo.bulkUpdateApartmentStatus(apartmentIds, status, tx);
      }
    });
  };

  /**
   * 특정 관리자가 담당하는 아파트의 모든 가입 대기 주민(USER) 상태를 일괄 변경
   * @param userId - 요청을 수행하는 관리자의 ID
   * @param status - 변경할 상태 (APPROVED/REJECTED)
   * @throws {NotFoundError} 관리자 정보 또는 관리 중인 아파트 정보가 없을 경우
   */
  bulkUpdateResidentStatus = async (userId: string, status: JoinStatus) => {
    const actor = await getTenantActor(userId);
    if (!actor.isAdmin) throw new UnauthorizedError("관리자 권한이 필요합니다.");
    await this.authRepo.bulkUpdateResidentStatus(actor.apartmentId, status);
  };

  /**
   * 특정 관리자(ADMIN) 및 관리 아파트 정보를 수정
   * - 관리자 기본 정보와 아파트 정보를 분리하여 각각의 Repository에 업데이트 요청
   * - 아파트 관련 필드가 포함된 경우, 해당 관리자에게 연결된 아파트가 있는지 사전에 검증
   * @param adminId - 수정 대상 관리자 ID
   * @param data - 수정할 관리자 및 아파트 데이터 (Partial)
   * @throws {NotFoundError} 관리자 또는 아파트 정보가 DB에 없을 경우 발생
   */
  updateAdminInfo = async (adminId: string, data: UpdateAdminInfo) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.apartmentId;
    const { apartmentName, apartmentAddress, apartmentManagementNumber, description, ...adminFields } = data;
    const isApartmentUpdateField = !!(apartmentName || apartmentAddress || apartmentManagementNumber || description);
    if (isApartmentUpdateField && !apartmentId) {
      throw new NotFoundError("해당 어드민이 관리하는 아파트 정보가 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      const adminFieldsPayload = Object.fromEntries(Object.entries(adminFields).filter(([_, v]) => v !== undefined));

      if (Object.keys(adminFieldsPayload).length > 0) {
        await this.authRepo.updateAdmin(adminId, adminFieldsPayload, tx);
      }

      if (isApartmentUpdateField) {
        const apartmentUpdatePayload = {
          ...(apartmentName && { name: apartmentName }),
          ...(apartmentAddress && { address: apartmentAddress }),
          ...(apartmentManagementNumber && { officeNumber: apartmentManagementNumber }),
          ...(description && { description }),
        };

        await this.apartRepo.updateApartment(apartmentId!, apartmentUpdatePayload, tx);
      }
    });
  };

  /**
   * 특정 관리자 계정과 그와 연결된 아파트 데이터를 삭제
   * - 계정 삭제와 아파트 삭제를 하나의 트랜잭션으로 묶어 유령 데이터 현상 방지
   * @param adminId - 삭제 대상 관리자 ID
   * @throws {NotFoundError} 관리자가 존재하지 않을 경우
   * @throws {BadRequestError} 관리자와 연결된 아파트 정보가 없을 경우
   */
  deleteAdmin = async (adminId: string) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.apartmentId;
    if (!apartmentId) {
      throw new BadRequestError("어드민과 연결된 아파트 정보가 없습니다.");
    }

    await prisma.$transaction(async (tx) => {
      // 유저의 아파트 참조를 먼저 해제하여 FK 제약조건 회피
      await this.authRepo.unlinkApartmentFromUser(adminId, tx);

      // FK 제약 조건 오류를 방지하기 위해 아파트에 종속된 데이터(Poll, Notice, Complaint, Board)와 아파트 삭제
      await this.apartRepo.deleteApartmentWithAssociations(apartmentId, tx);

      await this.authRepo.deleteUser(adminId, tx);
    });
  };

  /**
   * 가입 거절(REJECTED) 상태인 모든 관리자와 그들의 아파트 정보를 일괄 삭제 (SUPER_ADMIN용)
   * - 대량 삭제 시의 성능 향상을 위해 대상 ID를 선추출한 후 일괄 처리(deleteMany) 수행
   */
  adminClean = async () => {
    const rejectedAdmins = await this.authRepo.rejectedAdmin();

    if (rejectedAdmins.length === 0) return;

    const adminIds = rejectedAdmins.map((a) => a.id);
    const apartmentIds = rejectedAdmins.map((a) => a.apartmentId).filter((id): id is string => !!id);

    await prisma.$transaction(async (tx) => {
      if (apartmentIds.length > 0) {
        // 유저의 아파트 참조를 해제하여 아파트 삭제 시 FK 제약조건 오류 방지
        await this.authRepo.unlinkApartmentFromUsers(adminIds, tx);

        // FK 제약 조건 오류를 방지하기 위해 관련 하위 데이터 및 아파트 일괄 삭제
        await this.apartRepo.deleteApartmentsWithAssociations(apartmentIds, tx);
      }
      await this.authRepo.adminClean(adminIds, tx);
    });
  };

  /**
   * 본인 관리 아파트에 소속된 가입 거절(REJECTED) 상태의 주민들을 일괄 삭제 (ADMIN용)
   * @param adminId - 요청을 수행하는 관리자 ID
   * @throws {NotFoundError} 관리자 정보가 없을 경우
   * @throws {BadRequestError} 관리 중인 아파트 정보가 없을 경우
   */
  residentClean = async (adminId: string) => {
    const admin = await this.getAdminOrThrow(adminId);

    const apartmentId = admin.apartmentId;
    if (!apartmentId) {
      throw new BadRequestError("어드민과 연결된 아파트 정보가 없습니다.");
    }

    await this.authRepo.residentClean(apartmentId);
  };

  /**
   * 특정 ID의 사용자를 조회하고, 없거나 역할이 일치하지 않으면 에러를 발생시킵니다.
   * @private
   */
  private async getAdminOrThrow(adminId: string) {
    const admin = await this.authRepo.findById(adminId);
    if (!admin) throw new NotFoundError("해당 어드민을 찾을 수 없습니다.");

    return admin;
  }

  /**
   * 기존 토큰을 모두 삭제하고 새로운 토큰 세트를 DB에 저장 후 반환(로그인/재발급 시 사용)
   * @param user - 토큰에 담길 유저 정보 페이로드
   * @private
   */
  private rotateTokens = async (user: {
    id: string;
    username: string;
    role: string;
    apartmentId?: string | undefined;
  }) => {
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      apartmentId: user.apartmentId,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, { expiresIn: "15m" });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: "14d" });

    const newExpiresAt = expiresIn14Days();

    // 기존 토큰 모두 삭제 후 새 토큰 저장 (트랜잭션 사용)
    await prisma.$transaction(async (tx) => {
      await this.authRepo.deleteAllRefreshTokens(user.id, tx);
      await this.authRepo.saveRefreshToken(user.id, refreshToken, newExpiresAt, tx);
    });

    return { accessToken, refreshToken };
  };
}
