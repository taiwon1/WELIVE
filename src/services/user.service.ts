import { UpdateProfileDto, ValidatePassword } from "../structs/user.struct";
import { UserRepo } from "../repositories/user.repository";
import bcrypt from "bcrypt";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/errors";
import { AuthRepo } from "../repositories/auth.repository";
import { StorageService } from "./s3.service";
import prisma from "../lib/prisma";
import { LoginResponseDto } from "../models/auth.model";

export class UserService {
  private userRepo = new UserRepo();
  private authRepo = new AuthRepo();
  private storageService = new StorageService();

  getCurrentUser = async (userId: string) => {
    const user = await this.userRepo.findSessionUserById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedError("유효한 사용자 세션이 아닙니다.");
    }

    return new LoginResponseDto(user);
  };

  /**
   * 유저의 프로필 정보(이미지, 비밀번호)를 통합적으로 수정
   * DB 업데이트 로직을 하나의 트랜잭션으로 묶어 데이터 원자성 보장
   * @param userId - 수정 대상 유저 ID
   * @param data - 비밀번호 변경 데이터를 포함한 DTO
   * @param file - 새 프로필 이미지 파일 (선택 사항)
   * @throws {BadRequestError} 수정할 정보가 아무것도 전달되지 않은 경우
   */
  updateProfile = async (userId: string, data: UpdateProfileDto, file?: Express.Multer.File) => {
    // 수정 데이터 유무 검증
    const hasPasswordUpdate = !!(data?.currentPassword && data?.newPassword);
    if (!hasPasswordUpdate && !file) {
      throw new BadRequestError("수정할 정보가 전달되지 않았습니다.");
    }

    // 외부 서비스 처리: S3 파일 업로드
    let imageUrl: string | undefined;
    if (file) imageUrl = await this.storageService.uploadFile(file, "profiles");

    // 비밀번호 검증 및 해싱
    let passwordData: { hashedNewPassword: string; userName: string } | undefined;
    if (hasPasswordUpdate) {
      passwordData = await this.handlePasswordUpdate(userId, data.currentPassword!, data.newPassword!);
    }

    // 이미지 경로 업데이트 및 비밀번호 변경을 한 단위로 처리
    await prisma.$transaction(async (tx) => {
      // 이미지 경로 수정이 필요한 경우
      if (imageUrl) {
        await this.userRepo.updateProfile(userId, imageUrl, tx);
      }

      // 비밀번호 수정이 필요한 경우
      if (passwordData) {
        await this.authRepo.deleteAllRefreshTokens(userId, tx);
        await this.userRepo.updatePassword(userId, passwordData.hashedNewPassword, tx);
      }
    });

    return { message: "프로필 정보가 변경되었습니다.", imageUrl };
  };

  /**
   * 유저의 비밀번호만 변경
   * 비밀번호 검증 후 새 토큰 세팅을 위해 기존 리프레시 토큰 전체 삭제
   * @param userId - 대상 유저 ID
   * @param data - 현재 비밀번호와 새 비밀번호 객체
   */
  changePassword = async (userId: string, data: ValidatePassword) => {
    const { currentPassword, newPassword } = data;
    // 검증 및 해싱
    const { hashedNewPassword, userName } = await this.handlePasswordUpdate(userId, currentPassword, newPassword);

    // 비밀번호 업데이트와 세션 초기화 동시 수행
    await prisma.$transaction(async (tx) => {
      await this.userRepo.updatePassword(userId, hashedNewPassword, tx);
      await this.authRepo.deleteAllRefreshTokens(userId, tx);
    });

    return { message: `${userName}님의 비밀번호가 변경되었습니다. 다시 로그인해주세요.` };
  };

  /**
   * 비밀번호 변경을 위한 유효성 검사 및 Bcrypt 해싱 수행
   * 기존 비밀번호와의 동일 여부, 유저 존재 여부, 비밀번호 일치 여부 검증
   * @private
   * @returns 해싱된 새 비밀번호와 유저 이름 객체 반환
   * @throws {BadRequestError} 비밀번호가 동일하거나 일치하지 않는 경우
   * @throws {NotFoundError} 유저 정보를 찾을 수 없는 경우
   */

  private async handlePasswordUpdate(id: string, currentPw: string, newPw: string) {
    if (currentPw === newPw) {
      throw new BadRequestError("새 비밀번호는 기존 비밀번호와 다르게 설정해야 합니다.");
    }

    const user = await this.userRepo.findByUserId(id);
    if (!user) throw new NotFoundError("해당 유저를 찾을 수 없습니다.");

    const isMatch = await bcrypt.compare(currentPw, user.password);
    if (!isMatch) throw new BadRequestError("현재 비밀번호가 일치하지 않습니다.");

    const hashedNewPassword = await bcrypt.hash(newPw, 10);

    return { hashedNewPassword, userName: user.name };
  }
}
