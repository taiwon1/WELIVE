import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pgPkg from "pg";
import "dotenv/config";

const { Pool } = pgPkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  allowExitOnIdle: true,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  maxUses: 7500,
});

const adapter = new PrismaPg(pool);

const isTest = process.env.NODE_ENV === "test";
const isDevelopment = process.env.NODE_ENV === "development";

const prisma = new PrismaClient({
  adapter,
  log: isTest
    ? [{ emit: "stdout", level: "error" }] // 테스트 시에는 에러만 출력
    : isDevelopment
      ? [
        { emit: "stdout", level: "query" }, // 개발 시에는 전체 로그 출력
        { emit: "stdout", level: "error" },
        { emit: "stdout", level: "info" },
        { emit: "stdout", level: "warn" },
      ]
      : [
          { emit: "stdout", level: "error" },
          { emit: "stdout", level: "warn" },
        ],
});

export default prisma;
export { pool };
