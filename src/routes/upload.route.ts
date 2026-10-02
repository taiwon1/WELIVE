import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

const bucket = process.env.S3_BUCKET;
const region = process.env.AWS_REGION;

const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

if (!bucket) {
  throw new Error("S3_BUCKET is not set");
}

if (!region) {
  throw new Error("AWS_REGION is not set");
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error("지원하지 않는 파일 형식입니다. JPG, PNG, WEBP 형식만 업로드할 수 있습니다."));
    }

    cb(null, true);
  },
});

router.post("/upload", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "image file is required",
      });
    }

    const ext = EXTENSION_BY_MIME_TYPE[req.file.mimetype] || ".bin";
    const key = `uploads/${Date.now()}-${randomUUID()}${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }),
    );

    const assetBaseUrl = process.env.ASSET_BASE_URL?.replace(/\/$/, "");
    const objectUrl = assetBaseUrl
      ? `${assetBaseUrl}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return res.status(201).json({
      message: "upload success",
      key,
      url: objectUrl,
      contentType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error("S3 upload error:", error);

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

    if (error instanceof Error && error.message.includes("지원하지 않는 파일 형식")) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "upload failed",
    });
  }
});

export default router;
