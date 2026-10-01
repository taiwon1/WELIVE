import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import { randomUUID } from "crypto";
import path from "path";

export class UnsupportedFileTypeError extends Error {
  statusCode = 400;

  constructor() {
    super("지원하지 않는 파일 형식입니다. JPG, PNG, WEBP 형식만 업로드할 수 있습니다.");
    this.name = "UnsupportedFileTypeError";
  }
}

export class FileSizeLimitError extends Error {
  statusCode = 400;

  constructor() {
    super("파일 크기는 10MB 이하만 업로드할 수 있습니다.");
    this.name = "FileSizeLimitError";
  }
}

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  private readonly bucket = process.env.S3_BUCKET;
  private readonly region = process.env.AWS_REGION;

  constructor() {
    if (!this.bucket) {
      throw new Error("S3_BUCKET is not set");
    }

    if (!this.region) {
      throw new Error("AWS_REGION is not set");
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    this.validateFile(file);

    const ext = this.getSafeExtension(file);
    const key = `${folder}/${Date.now()}-${randomUUID()}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const assetBaseUrl = process.env.ASSET_BASE_URL?.replace(/\/$/, "");
    return assetBaseUrl
      ? `${assetBaseUrl}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);

      if (!key) {
        return;
      }

      await s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (error) {
      console.error("S3 파일 삭제 실패:", error);
    }
  }

  private validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new Error("업로드할 파일이 없습니다.");
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new UnsupportedFileTypeError();
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new FileSizeLimitError();
    }
  }

  private getSafeExtension(file: Express.Multer.File): string {
    const extensionFromMimeType = EXTENSION_BY_MIME_TYPE[file.mimetype];

    if (extensionFromMimeType) {
      return extensionFromMimeType;
    }

    const extensionFromOriginalName = path.extname(file.originalname || "").toLowerCase();

    if (extensionFromOriginalName) {
      return extensionFromOriginalName;
    }

    return ".bin";
  }

  private extractKeyFromUrl(fileUrl: string): string | null {
    try {
      const url = new URL(fileUrl);
      const key = url.pathname.replace(/^\/+/, "");

      return key || null;
    } catch {
      const urlParts = fileUrl.split(".com/");
      return urlParts[1] || null;
    }
  }
}
