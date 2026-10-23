import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { assert } from 'superstruct';
import { SuperAdminStruct } from '../structs/auth.struct';
import { AuthService } from '../services/auth.service';
import prisma, { pool } from '../lib/prisma';

// Passwords are accepted through stdin, never through process arguments.
try {
  const input: unknown = JSON.parse(readFileSync(0, 'utf8'));
  assert(input, SuperAdminStruct);
  await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(72651022)`;
    if (await tx.user.count({ where: { role: 'SUPER_ADMIN' } })) {
      throw new Error('Initial administrator already exists');
    }
    await new AuthService().createSuperAdmin(input, tx);
  });
  console.log('초기 최고관리자를 생성했습니다.');
} catch {
  // Validation errors can include submitted secrets; never print raw errors.
  console.error('초기 최고관리자 생성 실패: 입력 형식, 기존 계정 및 DB 연결을 확인해주세요.');
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
