import { Request, Response } from "express";
import multer from "multer";
import { UpdateProfileDto, ValidatePassword } from "../structs/user.struct";
import { UserService } from "../services/user.service";
import {
  FileSizeLimitError,
  UnsupportedFileTypeError,
} from "../services/s3.service";

type ErrorWithStatusCode = Error & {
  statusCode?: number;
  status?: number;
};

export class UserController {
  private userService = new UserService();

  getMe = async (req: Request, res: Response) => {
    const result = await this.userService.getCurrentUser(req.user.id);
    return res.status(200).json(result);
  };

  /**
   * 유저 프로필 정보 수정 요청 처리 (PATCH /me)
   * 인증 미들웨어를 통해 주입된 유저 ID와 멀터(Multer)를 통해 수신된 파일을 서비스로 전달
   * @param req - Request 객체 (body: UpdateProfileDto, file: Express.Multer.File)
   * @param res - Response 객체
   */
  updateProfile = async (
    req: Request<{}, {}, UpdateProfileDto>,
    res: Response,
  ) => {
    try {
      const userId = req.user.id;
      const file = req.file;

      const result = await this.userService.updateProfile(
        userId,
        req.body,
        file,
      );

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            message: "파일 크기는 10MB 이하만 업로드할 수 있습니다.",
          });
        }

        return res.status(400).json({
          message: error.message,
        });
      }

      if (error instanceof UnsupportedFileTypeError) {
        return res.status(400).json({
          message: error.message,
        });
      }

      if (error instanceof FileSizeLimitError) {
        return res.status(400).json({
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("지원하지 않는 파일 형식")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      if (
        error instanceof Error &&
        error.message.includes("파일 크기는 10MB 이하")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }

      const customError = error as ErrorWithStatusCode;
      const statusCode = customError.statusCode ?? customError.status;

      if (statusCode && statusCode >= 400 && statusCode < 500) {
        return res.status(statusCode).json({
          message: customError.message,
        });
      }

      console.error("[ERROR] PATCH /api/users/me :", error);

      return res.status(500).json({
        message: "프로필 수정 중 오류가 발생했습니다.",
      });
    }
  };

  /**
   * 유저 비밀번호 변경 요청 처리 (PATCH /password)
   * 현재 비밀번호와 새 비밀번호를 검증하여 계정 보안 정보를 업데이트
   * @param req - Request 객체 (body: ValidatePassword)
   * @param res - Response 객체
   */
  changePassword = async (
    req: Request<{}, {}, ValidatePassword>,
    res: Response,
  ) => {
    const userId = req.user.id;
    const result = await this.userService.changePassword(userId, req.body);
    return res.status(200).json(result);
  };
}
