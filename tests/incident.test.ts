import { randomUUID } from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import prisma, { pool } from '../src/lib/prisma';

// Real PostgreSQL + HTTP. Only this suite's UUID fixtures are removed.
const apartmentIds: string[] = [];
const userIds: string[] = [];
let admin: string, otherAdmin: string, resident: string, neighbor: string, stranger: string;
let boardId: string, otherBoardId: string;
const token = (id: string, role = 'USER') => jwt.sign({ id, role }, process.env.JWT_ACCESS_SECRET!, { expiresIn: '5m' });
const api = (method: 'get' | 'post' | 'delete', path: string, id = admin) =>
  request(app)[method](`/api/incidents${path}`).set('Authorization', `Bearer ${token(id)}`);

async function apartment() {
  const apt = await prisma.apartment.create({ data: {
    name: `incident-${randomUUID()}`, address: '테스트 주소', officeNumber: '0200000000', description: 'test',
    startComplexNumber: '1', endComplexNumber: '1', startDongNumber: '101', endDongNumber: '101',
    startFloorNumber: '1', endFloorNumber: '20', startHoNumber: '1', endHoNumber: '4',
    boards: { create: { name: '민원', type: 'COMPLAINT' } },
  }, include: { boards: true } });
  apartmentIds.push(apt.id);
  return apt;
}
async function user(apartmentId: string, role: 'ADMIN' | 'USER') {
  const id = randomUUID();
  const row = await prisma.user.create({ data: {
    id, username: id, email: `${id}@example.test`, contact: id, password: 'unused-test-password',
    name: '테스트 사용자', role, joinStatus: 'APPROVED',
    ...(role === 'ADMIN' ? { apartmentId } : { resident: { create: {
      apartmentId, building: '101', unitNumber: '101', contact: id, name: '테스트 주민',
    } } }),
  } });
  userIds.push(row.id);
  return row.id;
}
async function complaint(authorId = resident, targetBoard = boardId) {
  return prisma.complaint.create({ data: {
    title: '비공개 원문 제목', content: '개인정보가 포함된 비공개 내용', isPublic: false,
    authorId, boardId: targetBoard,
  } });
}
async function incident(ids?: string[]) {
  const complaintIds = ids ?? [(await complaint()).id];
  const result = await api('post', '').send({ title: '101동 승강기 장애', description: '공유 가능한 처리 내용', complaintIds });
  expect(result.status).toBe(201);
  return result.body as { id: string; version: number };
}
const updateBody = (extra: Record<string, unknown> = {}) => ({
  requestId: randomUUID(), expectedVersion: 0, content: '업체 방문 예정', status: 'IN_PROGRESS',
  expectedResolutionAt: '2026-10-03T04:00:00.000Z', ...extra,
});

beforeAll(async () => {
  const dbName = new URL(process.env.DATABASE_URL!).pathname.slice(1);
  if (dbName !== 'testdb' && !dbName.endsWith('_test')) throw new Error('incident 테스트는 testdb 또는 *_test 데이터베이스에서만 실행하세요.');
  const a = await apartment(), b = await apartment();
  boardId = a.boards[0]!.id; otherBoardId = b.boards[0]!.id;
  admin = await user(a.id, 'ADMIN'); otherAdmin = await user(b.id, 'ADMIN');
  resident = await user(a.id, 'USER'); neighbor = await user(a.id, 'USER'); stranger = await user(b.id, 'USER');
});
afterAll(async () => {
  await prisma.notificationOutbox.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
  await prisma.apartment.deleteMany({ where: { id: { in: apartmentIds } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  await prisma.$disconnect();
  await pool.end();
});

describe('공동 문제 생성과 민원 연결', () => {
  it('인증 없이 접근할 수 없다', async () => {
    expect((await request(app).get('/api/incidents')).status).toBe(401);
  });
  it('토큰 역할이 아닌 DB 역할로 생성 권한을 확인한다', async () => {
    const c = await complaint();
    const result = await request(app).post('/api/incidents').set('Authorization', `Bearer ${token(resident, 'ADMIN')}`)
      .send({ title: '장애', description: '내용', complaintIds: [c.id] });
    expect(result.status).toBe(403);
  });
  it('원본 민원의 내용과 상태를 유지한다', async () => {
    const c = await complaint();
    const i = await incident([c.id]);
    expect(await prisma.complaint.findUnique({ where: { id: c.id } })).toEqual(c);
    expect(await prisma.incidentComplaint.findUnique({ where: { complaintId: c.id } })).toMatchObject({ incidentId: i.id });
  });
  it('다른 단지 민원이 포함되면 공동 문제 생성 전체를 취소한다', async () => {
    const c = await complaint(), foreign = await complaint(stranger, otherBoardId);
    const before = await prisma.incident.count();
    const res = await api('post', '').send({ title: '장애', description: '설명', complaintIds: [c.id, foreign.id] });
    expect(res.status).toBe(404);
    expect(await prisma.incident.count()).toBe(before);
    expect(await prisma.incidentComplaint.findUnique({ where: { complaintId: c.id } })).toBeNull();
  });
  it('같은 문제에 같은 민원을 재연결해도 연결은 하나다', async () => {
    const c = await complaint(); const i = await incident([c.id]);
    const results = await Promise.all(Array.from({ length: 8 }, () => api('post', `/${i.id}/complaints`).send({ complaintIds: [c.id] })));
    expect(results.every(r => r.status === 200)).toBe(true);
    expect(await prisma.incidentComplaint.count({ where: { complaintId: c.id } })).toBe(1);
  });
  it('두 문제에 같은 민원을 동시에 연결하면 한쪽만 성공한다', async () => {
    const a = await incident(), b = await incident(), c = await complaint();
    const results = await Promise.all([a, b].map(i => api('post', `/${i.id}/complaints`).send({ complaintIds: [c.id] })));
    expect(results.map(r => r.status).sort()).toEqual([200, 409]);
    expect(await prisma.incidentComplaint.count({ where: { complaintId: c.id } })).toBe(1);
  });
  it('일괄 연결 중 하나가 충돌하면 나머지도 연결되지 않는다', async () => {
    const existing = await complaint(), free = await complaint();
    await incident([existing.id]); const other = await incident();
    expect((await api('post', `/${other.id}/complaints`).send({ complaintIds: [free.id, existing.id] })).status).toBe(409);
    expect(await prisma.incidentComplaint.findUnique({ where: { complaintId: free.id } })).toBeNull();
  });
  it('연결 해제는 멱등하며 원본은 남고 주민의 문제 접근은 종료된다', async () => {
    const c = await complaint(); const i = await incident([c.id]);
    for (let n = 0; n < 2; n++) expect((await api('delete', `/${i.id}/complaints/${c.id}`)).status).toBe(204);
    expect(await prisma.complaint.findUnique({ where: { id: c.id } })).not.toBeNull();
    expect((await api('get', `/${i.id}`, resident)).status).toBe(404);
  });
  it('빈 제목, 중복 ID, 과도한 페이지 크기를 거절한다', async () => {
    const c = await complaint();
    expect((await api('post', '').send({ title: '  ', description: '설명', complaintIds: [c.id] })).status).toBe(400);
    expect((await api('post', '').send({ title: '장애', description: '설명', complaintIds: [c.id, c.id] })).status).toBe(400);
    expect((await api('get', '?limit=1000')).status).toBe(400);
  });
});

describe('공동 문제 접근 범위', () => {
  it('주민은 자신의 연결만 받고 다른 비공개 민원은 노출되지 않는다', async () => {
    const own = await complaint(), other = await complaint(neighbor);
    const i = await incident([own.id, other.id]);
    const res = await api('get', `/${i.id}`, resident);
    expect(res.status).toBe(200);
    expect(res.body.complaintIds).toEqual([own.id]);
    expect(JSON.stringify(res.body)).not.toContain(other.id);
    expect(JSON.stringify(res.body)).not.toContain('개인정보가 포함된 비공개 내용');
    expect((await api('get', `/${i.id}`)).body.complaintIds.sort()).toEqual([own.id, other.id].sort());
  });
  it('다른 단지 관리자 및 연결되지 않은 주민은 조회·수정할 수 없다', async () => {
    const i = await incident();
    expect((await api('get', `/${i.id}`, otherAdmin)).status).toBe(404);
    expect((await api('get', `/${i.id}`, neighbor)).status).toBe(404);
    expect((await api('get', `/${i.id}/updates`, neighbor)).status).toBe(404);
    expect((await api('post', `/${i.id}/updates`, otherAdmin).send(updateBody())).status).toBe(404);
    expect((await api('post', `/${i.id}/updates`, resident).send(updateBody())).status).toBe(403);
    expect((await api('get', '', stranger)).body.incidents).toEqual([]);
  });
  it('가입 승인 취소와 퇴거가 기존 토큰에도 적용된다', async () => {
    const i = await incident();
    await prisma.user.update({ where: { id: resident }, data: { joinStatus: 'REJECTED' } });
    try { expect((await api('get', `/${i.id}`, resident)).status).toBe(403); }
    finally { await prisma.user.update({ where: { id: resident }, data: { joinStatus: 'APPROVED' } }); }
    await prisma.resident.updateMany({ where: { user: { id: resident } }, data: { residenceStatus: 'NO_RESIDENCE' } });
    try { expect((await api('get', `/${i.id}`, resident)).status).toBe(403); }
    finally { await prisma.resident.updateMany({ where: { user: { id: resident } }, data: { residenceStatus: 'RESIDENCE' } }); }
  });
});

describe('처리 이력과 멱등 알림', () => {
  it('민원 여러 건을 작성한 주민에게도 업데이트별 알림은 한 건이다', async () => {
    const a = await complaint(), b = await complaint(), c = await complaint(neighbor);
    const i = await incident([a.id, b.id, c.id]); const body = updateBody();
    const responses = await Promise.all(Array.from({ length: 10 }, () => api('post', `/${i.id}/updates`).send(body)));
    expect(responses.every(r => r.status === 200)).toBe(true);
    expect(new Set(responses.map(r => r.body.updateId)).size).toBe(1);
    expect(await prisma.incidentUpdate.count({ where: { incidentId: i.id } })).toBe(1);
    expect(await prisma.notification.count({ where: { sourceId: i.id } })).toBe(2);
    expect(await prisma.notificationOutbox.count({ where: { sourceId: i.id, status: 'PENDING' } })).toBe(2);
    expect(await prisma.incident.findUnique({ where: { id: i.id } })).toMatchObject({ version: 1, status: 'IN_PROGRESS' });
    const detail = await api('get', `/${i.id}`, resident);
    expect(detail.body.updates[0].content).toBe(body.content);
    expect(await prisma.complaint.findUnique({ where: { id: a.id } })).toMatchObject({ status: 'IN_PROGRESS' });
    expect(await prisma.complaint.count({ where: { id: { in: [a.id, b.id, c.id] }, status: 'IN_PROGRESS', adminReadAt: { not: null } } })).toBe(3);
  });
  it('동일 requestId의 다른 내용은 409로 거절한다', async () => {
    const i = await incident(); const body = updateBody();
    expect((await api('post', `/${i.id}/updates`).send(body)).status).toBe(200);
    expect((await api('post', `/${i.id}/updates`).send({ ...body, content: '다른 내용' })).status).toBe(409);
  });
  it('같은 버전에서 서로 다른 업데이트가 동시에 오면 한 건만 반영한다', async () => {
    const i = await incident();
    const results = await Promise.all(Array.from({ length: 10 }, () => api('post', `/${i.id}/updates`).send(updateBody())));
    expect(results.filter(r => r.status === 200)).toHaveLength(1);
    expect(results.filter(r => r.status === 409)).toHaveLength(9);
    expect(await prisma.incidentUpdate.count({ where: { incidentId: i.id } })).toBe(1);
  });
  it('진행→완료→재개→재완료는 별개 이벤트로 알림을 생성한다', async () => {
    const i = await incident();
    const noticesBefore = await prisma.notice.count();
    for (const [version, status] of ['IN_PROGRESS', 'RESOLVED', 'IN_PROGRESS', 'RESOLVED'].entries()) {
      expect((await api('post', `/${i.id}/updates`).send(updateBody({ expectedVersion: version, status }))).status).toBe(200);
      expect(await prisma.complaint.count({ where: { incidentLink: { incidentId: i.id }, status: status as 'IN_PROGRESS' | 'RESOLVED' } })).toBe(1);
    }
    expect(await prisma.notification.count({ where: { sourceId: i.id, userId: resident } })).toBe(4);
    expect(await prisma.notice.count()).toBe(noticesBefore);
    expect((await api('get', `/${i.id}/updates?limit=2`)).body.updates).toHaveLength(2);
  });
  it('허용되지 않는 상태 전이와 날짜를 거절한다', async () => {
    const i = await incident();
    expect((await api('post', `/${i.id}/updates`).send(updateBody({ status: 'RESOLVED' }))).status).toBe(400);
    expect((await api('post', `/${i.id}/updates`).send(updateBody({ expectedResolutionAt: 'tomorrow' }))).status).toBe(400);
    expect(await prisma.incidentUpdate.count({ where: { incidentId: i.id } })).toBe(0);
  });
  it('연결 해제한 주민은 이후 알림을 받지 않는다', async () => {
    const c = await complaint(), other = await complaint(neighbor);
    const i = await incident([c.id, other.id]);
    await api('delete', `/${i.id}/complaints/${other.id}`);
    expect((await api('post', `/${i.id}/updates`).send(updateBody())).status).toBe(200);
    expect(await prisma.notification.count({ where: { sourceId: i.id, userId: neighbor } })).toBe(0);
  });
  it('Outbox 저장 실패 시 상태·이력·알림 모두 롤백한다', async () => {
    const i = await incident();
    // Fault injection applies only to this new incident, not existing data.
    await prisma.$executeRawUnsafe(`ALTER TABLE "NotificationOutbox" ADD CONSTRAINT incident_test_failure CHECK ("sourceId" IS DISTINCT FROM '${i.id}')`);
    try {
      expect((await api('post', `/${i.id}/updates`).send(updateBody())).status).toBe(500);
      expect(await prisma.incidentUpdate.count({ where: { incidentId: i.id } })).toBe(0);
      expect(await prisma.notification.count({ where: { sourceId: i.id } })).toBe(0);
      expect(await prisma.incident.findUnique({ where: { id: i.id } })).toMatchObject({ version: 0, status: 'PENDING' });
      expect(await prisma.complaint.findFirst({ where: { incidentLink: { incidentId: i.id } } })).toMatchObject({ status: 'PENDING', adminReadAt: null });
    } finally {
      await prisma.$executeRawUnsafe('ALTER TABLE "NotificationOutbox" DROP CONSTRAINT incident_test_failure');
    }
  });
});

async function complaintApi(method: 'get' | 'patch', path: string, userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, include: { resident: true } });
  const access = jwt.sign({ id: userId, role: user.role, apartmentId: user.apartmentId ?? user.resident?.apartmentId }, process.env.JWT_ACCESS_SECRET!);
  return { send: (body?: object) => request(app)[method]('/api/complaints' + path).set('Authorization', 'Bearer ' + access).send(body) };
}

describe('관리자 민원 작업 흐름', () => {
  it('주민 조회는 미확인으로 유지하고 소속 관리자의 조회만 확인 처리한다', async () => {
    const c = await complaint();
    expect((await (await complaintApi('get', '/' + c.id, resident)).send()).status).toBe(200);
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: c.id } })).adminReadAt).toBeNull();
    expect((await (await complaintApi('get', '/' + c.id, otherAdmin)).send()).status).toBe(404);
    expect((await (await complaintApi('get', '/' + c.id, admin)).send()).status).toBe(200);
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: c.id } })).adminReadAt).not.toBeNull();
    const unread = await (await complaintApi('get', '?attention=unread&limit=100', admin)).send();
    expect(unread.body.complaints.some((item: { complaintId: string }) => item.complaintId === c.id)).toBe(false);
  });

  it('내용을 수정한 민원은 다시 미확인으로 표시한다', async () => {
    const c = await complaint();
    await (await complaintApi('get', '/' + c.id, admin)).send();
    expect((await (await complaintApi('patch', '/' + c.id, resident)).send({ title: '수정된 민원', content: '수정 내용', isPublic: false })).status).toBe(200);
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: c.id } })).adminReadAt).toBeNull();
  });

  it('연결된 민원은 개별 상태 변경을 거절하고 목록에 공동 문제를 표시한다', async () => {
    const c = await complaint(); const i = await incident([c.id]);
    expect((await (await complaintApi('patch', '/' + c.id + '/status', admin)).send({ status: 'RESOLVED' })).status).toBe(409);
    const list = await (await complaintApi('get', '?limit=100', admin)).send();
    expect(list.body.complaints.find((item: { complaintId: string }) => item.complaintId === c.id).incidentId).toBe(i.id);
    const candidates = await (await complaintApi('get', '?unlinked=true&attention=unfinished&limit=100', admin)).send();
    expect(candidates.body.complaints.some((item: { complaintId: string }) => item.complaintId === c.id)).toBe(false);
  });

  it('나중에 연결한 민원도 현재 공동 문제 상태를 따르고 해제 후에는 상태를 유지한다', async () => {
    const i = await incident(); const c = await complaint();
    await api('post', '/' + i.id + '/updates').send(updateBody());
    await api('post', '/' + i.id + '/complaints').send({ complaintIds: [c.id] });
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: c.id } })).status).toBe('IN_PROGRESS');
    await api('delete', '/' + i.id + '/complaints/' + c.id);
    await api('post', '/' + i.id + '/updates').send(updateBody({ expectedVersion: 1, status: 'RESOLVED' }));
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: c.id } })).status).toBe('IN_PROGRESS');
    expect((await (await complaintApi('patch', '/' + c.id + '/status', admin)).send({ status: 'PENDING' })).status).toBe(200);
  });

  it('처리 중 민원을 새로 묶어도 처리 대기로 돌아가지 않는다', async () => {
    const a = await complaint(), b = await complaint();
    await prisma.complaint.update({ where: { id: a.id }, data: { status: 'IN_PROGRESS' } });
    const i = await incident([a.id, b.id]);
    expect((await api('get', '/' + i.id)).body.status).toBe('IN_PROGRESS');
    expect((await prisma.complaint.findUniqueOrThrow({ where: { id: b.id } })).status).toBe('IN_PROGRESS');
  });
});
