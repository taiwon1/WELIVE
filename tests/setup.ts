import dotenv from "dotenv";
dotenv.config();

// Existing suites delete tables. Refuse development/production databases before imports run.
const testDbName = new URL(process.env.DATABASE_URL ?? "postgresql://localhost/missing").pathname.slice(1);
if (testDbName !== "testdb" && !testDbName.endsWith("_test")) {
  throw new Error("테스트는 testdb 또는 *_test 이름의 전용 DB에서만 실행하세요.");
}

process.env.JWT_SECRET = "test_secret_key_12345";
process.env.JWT_ACCESS_SECRET = "your_super_secret_key_1";
process.env.JWT_REFRESH_SECRET = "your_super_secret_key_2";
// AWS S3 관련 (mocking)
process.env.AWS_REGION = "ap-northeast-2";
process.env.S3_BUCKET = "mock-bucket";
process.env.AWS_ACCESS_KEY_ID = "mock-key";
process.env.AWS_SECRET_ACCESS_KEY = "mock-secret";

process.env.NODE_ENV = "test";
