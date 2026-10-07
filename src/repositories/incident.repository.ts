import { Prisma } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/errors';

type Tx = Prisma.TransactionClient;

// All membership and timeline writes for one incident share this lock.
export async function lockIncident(tx: Tx, id: string, apartmentId: string) {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Incident" WHERE id = ${id} AND "apartmentId" = ${apartmentId} FOR UPDATE
  `;
  if (!rows.length) throw new NotFoundError('공동 문제를 찾을 수 없습니다.');
  return tx.incident.findUniqueOrThrow({ where: { id } });
}

export async function linkComplaints(tx: Tx, incidentId: string, apartmentId: string, complaintIds: string[], initialize = false) {
  // Sorted row locks prevent two incidents from concurrently acquiring the same complaint.
  const ids = [...complaintIds].sort();
  await tx.$queryRaw`
    SELECT id FROM "Complaint" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE
  `;
  const complaints = await tx.complaint.findMany({
    where: { id: { in: ids }, board: { apartmentId, type: 'COMPLAINT' } },
    include: { incidentLink: true },
  });
  if (complaints.length !== ids.length) throw new NotFoundError('같은 단지의 민원만 연결할 수 있습니다.');
  if (complaints.some(item => item.incidentLink && item.incidentLink.incidentId !== incidentId)) {
    throw new ConflictError('다른 공동 문제에 연결된 민원입니다. 먼저 연결을 해제해주세요.');
  }
  if (initialize) {
    if (complaints.some(item => item.status === 'RESOLVED')) {
      throw new BadRequestError('완료된 민원은 새 공동 문제에 묶을 수 없습니다.');
    }
    if (complaints.some(item => item.status === 'IN_PROGRESS')) {
      await tx.incident.update({ where: { id: incidentId }, data: { status: 'IN_PROGRESS' } });
    }
  }
  await tx.incidentComplaint.createMany({
    data: ids.map(complaintId => ({ complaintId, incidentId })),
    skipDuplicates: true,
  });
  const incident = await tx.incident.findUniqueOrThrow({ where: { id: incidentId } });
  await tx.complaint.updateMany({
    where: { id: { in: ids }, status: { not: incident.status } },
    data: { status: incident.status },
  });
}

export const publicIncidentSelect = {
  id: true, title: true, description: true, status: true,
  expectedResolutionAt: true, version: true, createdAt: true, updatedAt: true,
} satisfies Prisma.IncidentSelect;

export const publicUpdateSelect = {
  id: true, content: true, status: true, expectedResolutionAt: true, createdAt: true,
} satisfies Prisma.IncidentUpdateSelect;
