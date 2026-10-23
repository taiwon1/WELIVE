import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../src/app';
import prisma, { pool } from '../src/lib/prisma';

const ids: string[] = [];
let apartmentId: string;
const password = 'SessionTest2026!';

beforeAll(async () => {
  const dbName = new URL(process.env.DATABASE_URL!).pathname.slice(1);
  if (dbName !== 'testdb' && !dbName.endsWith('_test')) throw new Error('테스트 전용 DB가 필요합니다.');
  const apartment = await prisma.apartment.create({ data: {
    name: `session-${randomUUID()}`, address: '테스트 단지', officeNumber: '0200000000', description: 'test',
    startComplexNumber: '1', endComplexNumber: '1', startDongNumber: '101', endDongNumber: '101',
    startFloorNumber: '1', endFloorNumber: '20', startHoNumber: '1', endHoNumber: '4',
    boards: { create: { name: '민원', type: 'COMPLAINT' } },
  } });
  apartmentId = apartment.id;
});

async function resident() {
  const suffix = randomUUID();
  const user = await prisma.user.create({ data: {
    username: suffix.slice(0, 20), email: `${suffix}@example.test`, contact: suffix,
    password: await bcrypt.hash(password, 4), name: '세션 주민', role: 'USER', joinStatus: 'APPROVED',
    resident: { create: { apartmentId, building: '101', unitNumber: '101', name: '세션 주민', contact: suffix } },
  } });
  ids.push(user.id);
  return user;
}

afterAll(async () => {
  await prisma.apartment.deleteMany({ where: { id: apartmentId } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
  await pool.end();
});

it('주민은 토큰 갱신 후에도 소속 단지의 민원 목록을 조회한다', async () => {
  const user = await resident();
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ username: user.username, password })).status).toBe(200);
  expect((await agent.post('/api/auth/refresh')).status).toBe(200);
  expect((await agent.get('/api/complaints')).status).toBe(200);
});

it.each(['inactive', 'rejected', 'movedOut'] as const)('%s 계정은 기존 세션을 갱신하거나 다시 로그인할 수 없다', async kind => {
  const user = await resident();
  const agent = request.agent(app);
  expect((await agent.post('/api/auth/login').send({ username: user.username, password })).status).toBe(200);
  if (kind === 'inactive') await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
  if (kind === 'rejected') await prisma.user.update({ where: { id: user.id }, data: { joinStatus: 'REJECTED' } });
  if (kind === 'movedOut') await prisma.resident.update({ where: { id: user.residentId! }, data: { residenceStatus: 'NO_RESIDENCE' } });
  expect((await agent.post('/api/auth/refresh')).status).toBe(401);
  expect((await agent.post('/api/auth/login').send({ username: user.username, password })).status).toBe(401);
});
