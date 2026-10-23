import { Prisma, JoinStatus } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateUserDTO } from "../types/auth.type";

export class AuthRepo {
  /**
   * 새로운 사용자를 생성 (트랜잭션 or prisma)
   * @param data - 생성할 사용자 데이터 (DTO)
   * @param tx - 트랜잭션 클라이언트 (선택)
   * @returns 생성된 사용자의 주요 정보 (ID, 이름, 이메일, 권한 등)
   */
  createUser = async (data: CreateUserDTO, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        joinStatus: true,
        isActive: true,
        role: true,
      },
    });
  };

  findUniqueUser = async (where: Prisma.UserWhereUniqueInput) => {
    return await prisma.user.findUnique({ where });
  };

  /**
   * 사용자 아이디(username)로 유저와 소속된 아파트 정보를 조회
   * @param username - 조회할 사용자 아이디
   * @returns 유저 정보와 거주/관리 아파트 정보를 포함한 객체
   */
  findByUsername = async (username: string) => {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        managedApartment: { include: { boards: true } },
        resident: {
          include: { apartment: { include: { boards: true } } },
        },
      },
    });
  };

  /**
   * 새로운 리프레시 토큰을 DB에 저장
   * @param userId - 토큰 소유자 ID
   * @param token - 생성된 리프레시 토큰 문자열
   * @param expiresAt - 토큰 만료 일시
   * @param tx - 트랜잭션 클라이언트 (선택)
   */
  saveRefreshToken = async (userId: string, token: string, expiresAt: Date, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  };

  /**
   * 특정 유저의 모든 리프레시 토큰을 삭제 (로그인 시 기존 세션 초기화용)
   * @param userId - 토큰을 삭제할 사용자 ID
   * @param tx - 트랜잭션 클라이언트 (선택)
   */
  deleteAllRefreshTokens = async (userId: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    await client.refreshToken.deleteMany({
      where: { userId },
    });
  };

  /**
   * 토큰 문자열로 리프레시 토큰의 유효성과 소유자 정보를 조회
   * @param token - 조회할 리프레시 토큰
   * @returns 토큰 만료일 및 연관된 유저 정보
   */
  findRefreshToken = async (token: string) => {
    return await prisma.refreshToken.findUnique({
      where: { token },
      select: {
        expiresAt: true,
        userId: true,
        user: { select: {
          id: true, username: true, role: true, apartmentId: true,
          isActive: true, joinStatus: true,
          resident: { select: { apartmentId: true, residenceStatus: true } },
        } },
      },
    });
  };

  /**
   * 특정 유저의 특정 리프레시 토큰 하나만 삭제 (로그아웃용)
   * @param userId - 토큰 소유자 ID
   * @param token - 삭제할 리프레시 토큰
   * @returns 삭제 성공 여부 (삭제된 행이 있으면 true)
   */
  deleteRefreshTokens = async (userId: string, token: string): Promise<boolean> => {
    const result = await prisma.refreshToken.deleteMany({
      where: { userId, token },
    });

    return result.count > 0;
  };

  /**
   * 사용자 ID를 통해 유저의 권한 및 상태 정보를 조회
   * @param id - 조회할 사용자 ID
   * @param tx - 트랜잭션 클라이언트 (선택)
   * @returns 권한, 가입 상태, 소속 아파트 ID를 포함한 유저 정보
   */
  findById = async (id: string, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    return await client.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        joinStatus: true,
        apartmentId: true,
        resident: { select: { apartmentId: true } },
      },
    });
  };

  /**
   * 특정 사용자의 가입 승인 상태를 업데이트
   * @param userId - 상태를 변경할 사용자 ID
   * @param status - 새로운 가입 상태 (APPROVED/REJECTED)
   * @param tx - 트랜잭션 클라이언트 (선택)
   */
  updateUserStatus = async (userId: string, status: JoinStatus, tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    const updateUser = await client.user.update({
      where: { id: userId },
      data: { joinStatus: status },
      select: { id: true, name: true, joinStatus: true },
    });
    return updateUser;
  };

  /**
   * 가입 대기 중인 모든 관리자(ADMIN)의 상태를 일괄 변경
   * @param status - 변경할 목적 상태 (APPROVED/REJECTED)
   * @returns Promise<void>
   */
  bulkUpdateAdminStatus = async (status: JoinStatus, tx?: Prisma.TransactionClient): Promise<void> => {
    const client = tx || prisma;
    await client.user.updateMany({
      where: {
        role: "ADMIN",
        joinStatus: "PENDING",
      },
      data: {
        joinStatus: status,
      },
    });
  };

  /**
   * 특정 아파트에 소속된 대기 중인 모든 주민(USER)의 상태를 일괄 변경
   * @param apartmentId - 대상 아파트 ID
   * @param status - 변경할 목적 상태 (APPROVED/REJECTED)
   */
  bulkUpdateResidentStatus = async (apartmentId: string, status: JoinStatus) => {
    // 해당 아파트에 소속된 모든 Resident의 ID 또는 연결된 User ID를 먼저 가져옴
    const residents = await prisma.resident.findMany({
      where: { apartmentId: apartmentId },
      select: { user: { select: { id: true } } },
    });

    // 추출된 User ID 목록
    const userIds = residents.map((r) => r.user?.id).filter((id): id is string => !!id);

    if (userIds.length === 0) return { count: 0 };

    // 해당 User ID들에 대해 일괄 업데이트를 진행
    await prisma.user.updateMany({
      where: {
        id: { in: userIds },
        joinStatus: "PENDING",
        role: "USER",
      },
      data: { joinStatus: status },
    });
  };

  /**
   * 특정 관리자(ADMIN)의 계정 정보를 업데이트
   * @param adminId - 수정할 관리자 ID
   * @param data - 업데이트할 유저 데이터
   * @param tx - 트랜잭션 클라이언트
   */
  updateAdmin = async (adminId: string, data: Prisma.UserUpdateInput, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: adminId },
      data: data,
    });
  };

  /**
   * 특정 유저 계정을 삭제
   * - 관리자 삭제 시 아파트 삭제와 함께 실행됨
   * @param id - 삭제할 유저 ID
   * @param tx - 트랜잭션 클라이언트
   */
  deleteUser = async (id: string, tx: Prisma.TransactionClient) => {
    await tx.user.delete({
      where: { id },
    });
  };

  /**
   * 가입 거절(REJECTED) 상태인 모든 관리자 목록을 조회
   * - 성능 최적화를 위해 삭제 판단에 필요한 ID와 연관 아파트 ID만 선택적으로 조회
   * @returns 거절된 관리자 ID와 해당 관리자가 소유한 아파트 ID 목록
   */
  rejectedAdmin = async () => {
    return await prisma.user.findMany({
      where: { role: "ADMIN", joinStatus: "REJECTED" },
      select: { id: true, apartmentId: true },
    });
  };

  /**
   * 전달받은 ID 목록에 해당하는 관리자 계정들을 일괄 삭제
   * @param ids - 삭제할 관리자 ID 배열
   * @param tx - 트랜잭션 클라이언트
   */
  adminClean = async (ids: string[], tx: Prisma.TransactionClient) => {
    await tx.user.deleteMany({
      where: { id: { in: ids } },
    });
  };

  /**
   * 특정 아파트에 소속된 가입 거절(REJECTED) 상태의 일반 주민(USER)들을 일괄 삭제
   * @param apartmentId - 대상 아파트 ID
   */
  residentClean = async (apartmentId: string) => {
    await prisma.user.deleteMany({
      where: { role: "USER", joinStatus: "REJECTED", resident: { apartmentId } },
    });
  };

  /**
   * 가입 대기 중인 모든 관리자(ADMIN)의 아파트 ID 목록을 조회
   * @param tx - 트랜잭션 클라이언트 (선택)
   * @returns 아파트 ID 배열
   */
  getPendingAdminApartmentIds = async (tx?: Prisma.TransactionClient) => {
    const client = tx || prisma;
    const admins = await client.user.findMany({
      where: { role: "ADMIN", joinStatus: "PENDING" },
      select: { apartmentId: true },
    });
    return admins.map((a) => a.apartmentId).filter((id): id is string => !!id);
  };

  /**
   * 입주민 ID 또는 사용자 ID로 유저 정보를 조회
   */
  findResidentUserById = async (residentId: string) => {
    return await prisma.user.findFirst({
      where: {
        OR: [{ id: residentId }, { residentId: residentId }],
      },
    });
  };

  /**
   * 단일 유저의 아파트 참조 해제
   */
  unlinkApartmentFromUser = async (userId: string, tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: { apartmentId: null },
    });
  };

  /**
   * 다수 유저의 아파트 참조 일괄 해제
   */
  unlinkApartmentFromUsers = async (userIds: string[], tx: Prisma.TransactionClient) => {
    await tx.user.updateMany({
      where: { id: { in: userIds } },
      data: { apartmentId: null },
    });
  };
}
