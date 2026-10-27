import { Prisma } from '@prisma/client';
import type { Infer } from 'superstruct';
import prisma from '../lib/prisma';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../errors/errors';
import { CreateIncidentStruct, IncidentUpdateStruct } from '../structs/incident.struct';
import { linkComplaints, lockIncident, publicIncidentSelect, publicUpdateSelect } from '../repositories/incident.repository';
import { createNotificationWithOutbox } from '../repositories/notification.repository';

type Tx = Prisma.TransactionClient;
type Actor = { id: string; apartmentId: string; isAdmin: boolean };

// DB membership is authoritative; revoked or moved users must not retain token privileges.
async function actorFor(tx: Tx, userId: string, adminOnly = false): Promise<Actor> {
  const user = await tx.user.findUnique({ where: { id: userId }, include: { resident: true } });
  if (!user || !user.isActive || user.joinStatus !== 'APPROVED') {
    throw new ForbiddenError('승인된 활성 계정만 이용할 수 있습니다.');
  }
  const isAdmin = user.role === 'ADMIN';
  const apartmentId = isAdmin ? user.apartmentId :
    user.role === 'USER' && user.resident?.residenceStatus === 'RESIDENCE' ? user.resident.apartmentId : null;
  if (!apartmentId) throw new ForbiddenError('현재 거주하거나 관리하는 단지가 필요합니다.');
  if (adminOnly && !isAdmin) throw new ForbiddenError('해당 단지의 관리자 권한이 필요합니다.');
  return { id: user.id, apartmentId, isAdmin };
}

function visibleWhere(actor: Actor): Prisma.IncidentWhereInput {
  return {
    apartmentId: actor.apartmentId,
    ...(!actor.isAdmin && { complaints: { some: { complaint: { authorId: actor.id } } } }),
  };
}

async function assertVisible(tx: Tx, actor: Actor, id: string) {
  const incident = await tx.incident.findFirst({ where: { id, ...visibleWhere(actor) }, select: publicIncidentSelect });
  if (!incident) throw new NotFoundError('공동 문제를 찾을 수 없습니다.');
  return incident;
}

export async function createIncident(userId: string, body: Infer<typeof CreateIncidentStruct>) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId, true);
    const incident = await tx.incident.create({ data: {
      apartmentId: actor.apartmentId, title: body.title, description: body.description, createdById: actor.id,
    }, select: publicIncidentSelect });
    await linkComplaints(tx, incident.id, actor.apartmentId, body.complaintIds, true);
    return tx.incident.findUniqueOrThrow({ where: { id: incident.id }, select: publicIncidentSelect });
  });
}

export async function getIncidents(userId: string, page: number, limit: number) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId);
    const where = visibleWhere(actor);
    const incidents = await tx.incident.findMany({ where, select: publicIncidentSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit });
    return { incidents, totalCount: await tx.incident.count({ where }) };
  });
}

export async function getIncident(userId: string, id: string) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId);
    const incident = await assertVisible(tx, actor, id);
    // Residents receive no other complaint IDs, titles, authors, counts or private content.
  const ownLinks = await tx.incidentComplaint.findMany({
      where: { incidentId: id, ...(!actor.isAdmin && { complaint: { authorId: actor.id } }) },
      select: { complaintId: true, complaint: { select: { title: true } } }, orderBy: { complaintId: 'asc' },
    });
    const updates = await tx.incidentUpdate.findMany({ where: { incidentId: id }, select: publicUpdateSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20 });
    return { ...incident, complaintIds: ownLinks.map(link => link.complaintId),
      complaints: ownLinks.map(link => ({ id: link.complaintId, title: link.complaint.title })), updates };
  });
}

export async function getUpdates(userId: string, id: string, page: number, limit: number) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId);
    await assertVisible(tx, actor, id);
    const where = { incidentId: id };
    const updates = await tx.incidentUpdate.findMany({ where, select: publicUpdateSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit });
    return { updates, totalCount: await tx.incidentUpdate.count({ where }) };
  });
}

export async function attachComplaints(userId: string, id: string, complaintIds: string[]) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId, true);
    await lockIncident(tx, id, actor.apartmentId);
    await linkComplaints(tx, id, actor.apartmentId, complaintIds);
    return { message: '민원이 공동 문제에 연결되었습니다.' };
  });
}

export async function detachComplaint(userId: string, id: string, complaintId: string) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId, true);
    await lockIncident(tx, id, actor.apartmentId);
    await tx.incidentComplaint.deleteMany({ where: { incidentId: id, complaintId } });
  });
}

export async function postUpdate(userId: string, id: string, body: Infer<typeof IncidentUpdateStruct>) {
  return prisma.$transaction(async tx => {
    const actor = await actorFor(tx, userId, true);
    const incident = await lockIncident(tx, id, actor.apartmentId);
    const expectedResolutionAt = body.expectedResolutionAt === null ? null : new Date(body.expectedResolutionAt);
    const previous = await tx.incidentUpdate.findUnique({
      where: { incidentId_requestId: { incidentId: id, requestId: body.requestId } },
    });
    if (previous) {
      if (previous.content !== body.content || previous.status !== body.status ||
          previous.expectedVersion !== body.expectedVersion ||
          previous.expectedResolutionAt?.getTime() !== expectedResolutionAt?.getTime()) {
        throw new ConflictError('같은 requestId를 다른 내용으로 사용할 수 없습니다.');
      }
      return { updateId: previous.id, version: previous.expectedVersion + 1 };
    }
    if (incident.version !== body.expectedVersion) throw new ConflictError('공동 문제가 변경되었습니다. 새로 조회해주세요.');
    const transitions = { PENDING: ['PENDING', 'IN_PROGRESS'], IN_PROGRESS: ['IN_PROGRESS', 'RESOLVED'], RESOLVED: ['RESOLVED', 'IN_PROGRESS'] };
    if (!transitions[incident.status].includes(body.status)) throw new BadRequestError('허용되지 않는 상태 변경입니다.');
    const update = await tx.incidentUpdate.create({ data: {
      incidentId: id, requestId: body.requestId, expectedVersion: body.expectedVersion,
      content: body.content, status: body.status, expectedResolutionAt, authorId: actor.id,
    } });
    await tx.incident.update({ where: { id }, data: {
      status: body.status, expectedResolutionAt, version: { increment: 1 },
    } });
    // The shared workflow is authoritative while a complaint remains linked.
    // No separate complaint notification is generated: one incident update per resident.
    await tx.complaint.updateMany({
      where: { incidentLink: { incidentId: id } },
      data: { status: body.status, adminReadAt: new Date() },
    });
    const recipients = await tx.user.findMany({ where: {
      role: 'USER', isActive: true, joinStatus: 'APPROVED',
      resident: { apartmentId: actor.apartmentId, residenceStatus: 'RESIDENCE' },
      complaints: { some: { incidentLink: { incidentId: id } } },
    }, select: { id: true } });
    // One row per user even when that user has several linked complaints.
    // Outbox worker retries delivery; no Redis request is needed inside this transaction.
    for (const recipient of recipients) {
      await createNotificationWithOutbox(tx, {
        userId: recipient.id, notificationType: 'INCIDENT_UPDATED', sourceType: 'INCIDENT', sourceId: id,
        dedupeKey: `INCIDENT_UPDATED:${id}:${update.id}`,
        title: '민원 처리 상황 업데이트', content: '접수하신 민원의 공동 문제 처리 상황이 업데이트되었습니다.',
      });
    }
    return { updateId: update.id, version: incident.version + 1 };
  }, { timeout: 15000 });
}
