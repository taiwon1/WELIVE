import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../src/app';
import prisma, { pool } from '../src/lib/prisma';

jest.mock('../src/routes/upload.route', () => {
  const express = require('express');
  return express.Router();
});
jest.mock('../src/lib/s3', () => ({ s3: { send: jest.fn() } }));

describe('단지 간 게시글 접근 차단', () => {
  const prefix = 'tenant_isolation_';
  let apartmentIds: string[] = [];
  let aAdminId: string;
  let aResidentId: string;
  let bAdminId: string;
  let bResidentId: string;
  let aComplaintBoard: string;
  let aNoticeBoard: string;
  let bComplaintBoard: string;
  let bNoticeBoard: string;
  let bPollBoard: string;
  let bComplaintId: string;
  let bNoticeId: string;
  let bCommentId: string;
  let bPollId: string;
  let bOptionId: string;
  let bEventId: string;
  let bUnregisteredResidentId: string;
  let bPendingUserId: string;

  const token = (id: string, role: 'ADMIN' | 'USER', apartmentId: string) =>
    'Bearer ' + jwt.sign(
      { id, username: prefix + id, role, apartmentId },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: '1h' },
    );

  beforeAll(async () => {
    for (const suffix of ['a', 'b']) {
      const apartment = await prisma.apartment.create({
        data: {
          name: prefix + suffix,
          address: '테스트 주소',
          officeNumber: '02-0000-0000',
          description: '격리 검증',
          startComplexNumber: '1',
          endComplexNumber: '1',
          startDongNumber: '101',
          endDongNumber: '101',
          startFloorNumber: '1',
          endFloorNumber: '10',
          startHoNumber: '1',
          endHoNumber: '4',
          apartmentStatus: 'APPROVED',
          boards: { create: [
            { name: '민원', type: 'COMPLAINT' },
            { name: '공지', type: 'NOTICE' },
            { name: '투표', type: 'POLL' },
          ] },
        },
        include: { boards: true },
      });
      apartmentIds.push(apartment.id);
      const admin = await prisma.user.create({
        data: {
          username: prefix + suffix + '_admin',
          email: prefix + suffix + '_admin@test.invalid',
          contact: '01000000' + (suffix === 'a' ? '101' : '201'),
          password: 'unused',
          name: suffix + ' 관리자',
          role: 'ADMIN',
          joinStatus: 'APPROVED',
          apartmentId: apartment.id,
        },
      });
      const resident = await prisma.resident.create({
        data: {
          building: '101',
          unitNumber: '101',
          contact: '01000000' + (suffix === 'a' ? '102' : '202'),
          name: suffix + ' 입주민',
          apartmentId: apartment.id,
          residenceStatus: 'RESIDENCE',
          isRegistered: true,
        },
      });
      const user = await prisma.user.create({
        data: {
          username: prefix + suffix + '_user',
          email: prefix + suffix + '_user@test.invalid',
          contact: resident.contact,
          password: 'unused',
          name: resident.name,
          role: 'USER',
          joinStatus: 'APPROVED',
          residentId: resident.id,
          apartmentDong: '101',
          apartmentHo: '101',
        },
      });
      const complaintBoard = apartment.boards.find(x => x.type === 'COMPLAINT')!.id;
      const noticeBoard = apartment.boards.find(x => x.type === 'NOTICE')!.id;
      const pollBoard = apartment.boards.find(x => x.type === 'POLL')!.id;
      if (suffix === 'a') {
        aAdminId = admin.id;
        aResidentId = user.id;
        aComplaintBoard = complaintBoard;
        aNoticeBoard = noticeBoard;
      } else {
        bAdminId = admin.id;
        bResidentId = user.id;
        bComplaintBoard = complaintBoard;
        bNoticeBoard = noticeBoard;
        bPollBoard = pollBoard;
      }
    }
    const preRegistered = await prisma.resident.create({
      data: {
        building: '101', unitNumber: '103', contact: '01000000203',
        name: 'B 미가입 주민', apartmentId: apartmentIds[1], isRegistered: false,
      },
    });
    bUnregisteredResidentId = preRegistered.id;
    const pending = await prisma.user.create({
      data: {
        username: prefix + 'b_pending',
        email: prefix + 'b_pending@test.invalid',
        contact: '01000000204',
        password: 'unused',
        name: 'B 신청 주민',
        role: 'USER',
        apartmentName: prefix + 'b',
        apartmentDong: '101',
        apartmentHo: '104',
        joinStatus: 'PENDING',
      },
    });
    bPendingUserId = pending.id;
    const complaint = await prisma.complaint.create({
      data: { title: 'B동 비공개 민원', content: '비공개 내용', boardId: bComplaintBoard, authorId: bResidentId, isPublic: false },
    });
    bComplaintId = complaint.id;
    const notice = await prisma.notice.create({
      data: { title: 'B동 공지', content: '공지 내용', category: 'ETC', boardId: bNoticeBoard, authorId: bAdminId },
    });
    bNoticeId = notice.id;
    const comment = await prisma.comment.create({
      data: { boardType: 'COMPLAINT', boardId: bComplaintId, authorId: bResidentId, content: '비공개 댓글' },
    });
    bCommentId = comment.id;
    const poll = await prisma.poll.create({
      data: {
        title: 'B동 투표', content: '투표 내용',
        boardId: apartmentIds.length === 2 ? bPollBoard : '',
        authorId: bAdminId, status: 'IN_PROGRESS', buildingPermission: 0,
        startDate: new Date(Date.now() - 60_000),
        endDate: new Date(Date.now() + 3_600_000),
        options: { create: [{ title: '찬성' }, { title: '반대' }] },
      },
      include: { options: true },
    });
    bPollId = poll.id;
    bOptionId = poll.options[0].id;
    const event = await prisma.event.create({
      data: {
        title: 'B동 일정', category: 'ETC', type: 'NOTICE',
        boardType: 'NOTICE', boardId: bNoticeId,
        apartmentId: apartmentIds[1],
        start: new Date(), end: new Date(Date.now() + 3_600_000),
      },
    });
    bEventId = event.id;
  });

  afterAll(async () => {
    await prisma.notificationOutbox.deleteMany({ where: { notification: { user: { username: { startsWith: prefix } } } } });
    await prisma.notification.deleteMany({ where: { user: { username: { startsWith: prefix } } } });
    await prisma.comment.deleteMany({ where: { author: { username: { startsWith: prefix } } } });
    await prisma.event.deleteMany({ where: { apartmentId: { in: apartmentIds } } });
    await prisma.vote.deleteMany({ where: { poll: { board: { apartmentId: { in: apartmentIds } } } } });
    await prisma.pollOption.deleteMany({ where: { poll: { board: { apartmentId: { in: apartmentIds } } } } });
    await prisma.poll.deleteMany({ where: { board: { apartmentId: { in: apartmentIds } } } });
    await prisma.notice.deleteMany({ where: { board: { apartmentId: { in: apartmentIds } } } });
    await prisma.complaint.deleteMany({ where: { board: { apartmentId: { in: apartmentIds } } } });
    await prisma.refreshToken.deleteMany({ where: { user: { username: { startsWith: prefix } } } });
    await prisma.user.deleteMany({ where: { username: { startsWith: prefix } } });
    await prisma.resident.deleteMany({ where: { apartmentId: { in: apartmentIds } } });
    await prisma.board.deleteMany({ where: { apartmentId: { in: apartmentIds } } });
    await prisma.apartment.deleteMany({ where: { id: { in: apartmentIds } } });
    await prisma.$disconnect();
    await pool.end();
  });

  it('다른 단지 주민의 가입 승인을 차단한다', async () => {
    const response = await request(app).patch('/api/auth/residents/' + bResidentId + '/status')
      .set('Authorization', token(aAdminId, 'ADMIN', apartmentIds[0]))
      .send({ status: 'REJECTED' });
    expect(response.status).toBe(404);
    expect((await prisma.user.findUnique({ where: { id: bResidentId } }))?.joinStatus).toBe('APPROVED');
  });

  it('다른 단지의 미가입 주민을 자동 승인하거나 연결하지 않는다', async () => {
    const response = await request(app).post('/api/auth/signup').send({
      username: 'tis_foreign_signup',
      password: 'password123!',
      name: 'B 미가입 주민',
      contact: '01000000203',
      email: prefix + 'foreign_signup@test.invalid',
      role: 'USER',
      apartmentName: prefix + 'a',
      apartmentDong: '101',
      apartmentHo: '103',
    });
    expect(response.status).toBe(409);
    expect((await prisma.resident.findUnique({ where: { id: bUnregisteredResidentId }, include: { user: true } }))?.user).toBeNull();
    expect(await prisma.user.findUnique({ where: { username: 'tis_foreign_signup' } })).toBeNull();
  });

  it('다른 단지의 대기 사용자를 주민으로 등록하지 않는다', async () => {
    const response = await request(app).post('/api/residents/from-users/' + bPendingUserId)
      .set('Authorization', token(aAdminId, 'ADMIN', apartmentIds[0]));
    expect(response.status).toBe(404);
    expect((await prisma.user.findUnique({ where: { id: bPendingUserId } }))?.joinStatus).toBe('PENDING');
  });

  it('다른 단지 게시판으로 민원·공지를 만들 수 없다', async () => {
    const a = apartmentIds[0];
    const complaint = await request(app).post('/api/complaints')
      .set('Authorization', token(aResidentId, 'USER', a))
      .send({ title: '침입 민원', content: '내용', isPublic: true, boardId: bComplaintBoard });
    expect(complaint.status).toBe(404);
    const notice = await request(app).post('/api/notices')
      .set('Authorization', token(aAdminId, 'ADMIN', a))
      .send({ title: '침입 공지', content: '내용', category: 'ETC', isPinned: false, boardId: bNoticeBoard });
    expect(notice.status).toBe(404);
  });

  it('다른 단지 게시글의 상세·수정·삭제를 차단한다', async () => {
    const a = apartmentIds[0];
    const residentAuth = token(aResidentId, 'USER', a);
    const adminAuth = token(aAdminId, 'ADMIN', a);
    expect((await request(app).get('/api/complaints/' + bComplaintId).set('Authorization', residentAuth)).status).toBe(404);
    expect((await request(app).delete('/api/complaints/' + bComplaintId).set('Authorization', adminAuth)).status).toBe(404);
    expect((await request(app).get('/api/notices/' + bNoticeId).set('Authorization', residentAuth)).status).toBe(404);
    expect((await request(app).patch('/api/notices/' + bNoticeId).set('Authorization', adminAuth)
      .send({ title: '변조' })).status).toBe(404);
    expect((await request(app).delete('/api/notices/' + bNoticeId).set('Authorization', adminAuth)).status).toBe(404);
  });

  it('다른 단지 글의 댓글 생성·수정·삭제를 차단한다', async () => {
    const a = apartmentIds[0];
    const residentAuth = token(aResidentId, 'USER', a);
    const adminAuth = token(aAdminId, 'ADMIN', a);
    expect((await request(app).post('/api/comments').set('Authorization', residentAuth)
      .send({ boardType: 'COMPLAINT', boardId: bComplaintId, content: '침입' })).status).toBe(404);
    expect((await request(app).post('/api/comments').set('Authorization', residentAuth)
      .send({ boardType: 'NOTICE', boardId: bNoticeId, content: '침입' })).status).toBe(404);
    expect((await request(app).patch('/api/comments/' + bCommentId).set('Authorization', residentAuth)
      .send({ content: '변조' })).status).toBe(404);
    expect((await request(app).delete('/api/comments/' + bCommentId).set('Authorization', adminAuth)).status).toBe(404);
  });

  it('다른 단지 투표 목록·상세·변경·참여를 차단한다', async () => {
    const a = apartmentIds[0];
    const adminAuth = token(aAdminId, 'ADMIN', a);
    const residentAuth = token(aResidentId, 'USER', a);
    const list = await request(app).get('/api/polls').set('Authorization', residentAuth);
    expect(list.status).toBe(200);
    expect(list.body.polls.some((poll: { pollId: string }) => poll.pollId === bPollId)).toBe(false);
    expect((await request(app).get('/api/polls/' + bPollId).set('Authorization', residentAuth)).status).toBe(404);
    expect((await request(app).patch('/api/polls/' + bPollId).set('Authorization', adminAuth)
      .send({ title: '변조' })).status).toBe(404);
    expect((await request(app).delete('/api/polls/' + bPollId).set('Authorization', adminAuth)).status).toBe(404);
    expect((await request(app).post('/api/options/' + bOptionId + '/vote').set('Authorization', residentAuth)).status).toBe(404);
    expect((await request(app).delete('/api/options/' + bOptionId + '/vote').set('Authorization', residentAuth)).status).toBe(404);
  });

  it('다른 단지 일정 목록·변경·삭제를 차단한다', async () => {
    const a = apartmentIds[0];
    const adminAuth = token(aAdminId, 'ADMIN', a);
    const residentAuth = token(aResidentId, 'USER', a);
    const foreignList = await request(app).get('/api/event')
      .query({ apartmentId: apartmentIds[1], year: 2026, month: 10 })
      .set('Authorization', residentAuth);
    expect(foreignList.status).toBe(403);
    const ownList = await request(app).get('/api/event')
      .query({ apartmentId: a, year: 2026, month: 10 })
      .set('Authorization', residentAuth);
    expect(ownList.status).toBe(200);
    expect(ownList.body.some((event: { id: string }) => event.id === bEventId)).toBe(false);
    const upsert = await request(app).put('/api/event')
      .query({ boardType: 'NOTICE', boardId: bNoticeId, startDate: new Date().toISOString(), endDate: new Date().toISOString() })
      .set('Authorization', adminAuth);
    expect(upsert.status).toBe(404);
    expect((await request(app).delete('/api/event/' + bEventId).set('Authorization', adminAuth)).status).toBe(404);
  });

  it('공지 수정 시 게시판을 다른 단지로 옮길 수 없다', async () => {
    const a = apartmentIds[0];
    const ownNotice = await prisma.notice.create({
      data: { title: 'A동 공지', content: '내용', category: 'ETC', boardId: aNoticeBoard, authorId: aAdminId },
    });
    const response = await request(app).patch('/api/notices/' + ownNotice.id)
      .set('Authorization', token(aAdminId, 'ADMIN', a))
      .send({ boardId: bNoticeBoard });
    expect(response.status).toBe(404);
    expect((await prisma.notice.findUnique({ where: { id: ownNotice.id } }))?.boardId).toBe(aNoticeBoard);
  });
});
