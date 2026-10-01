import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma";
import { CreateNotificationInput } from "../types/notification.type";

export async function createNotifiacationRecord(input: CreateNotificationInput) {
  return prisma.$transaction((tx) => createNotificationWithOutbox(tx, input));
}

// Use the caller transaction to commit the business event and its delivery together.
export async function createNotificationWithOutbox(tx: Prisma.TransactionClient, input: CreateNotificationInput) {
  const notification = await tx.notification.create({
    data: {
      userId: input.userId,
      content: input.content,
      notificationType: input.notificationType,
      dedupeKey: input.dedupeKey ?? null,
      complaintId: input.complaintId ?? null,
      noticeId: input.noticeId ?? null,
      pollId: input.pollId ?? null,
      isChecked: false,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      title: input.title ?? null,
    },
  });

  await tx.notificationOutbox.create({
    data: {
      notificationId: notification.notificationId,
      userId: input.userId,
      notificationType: input.notificationType,
      sourceType: input.sourceType ?? null,
      sourceId: input.sourceId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      payload: {
        notificationId: notification.notificationId,
        userId: input.userId,
        content: input.content,
        notificationType: input.notificationType,
        complaintId: input.complaintId ?? null,
        noticeId: input.noticeId ?? null,
        pollId: input.pollId ?? null,
      },
      status: "PENDING",
    },
  });

  return notification;
}

export async function findNotificationByDedupeKey(
  userId: string,
  dedupeKey: string,
): Promise<Awaited<ReturnType<typeof prisma.notification.findUnique>>>;
export async function findNotificationByDedupeKey(
  dedupeKey: string,
): Promise<Awaited<ReturnType<typeof prisma.notification.findFirst>>>;
export async function findNotificationByDedupeKey(userIdOrDedupeKey: string, dedupeKey?: string) {
  if (dedupeKey !== undefined) {
    return prisma.notification.findUnique({
      where: { userId_dedupeKey: { userId: userIdOrDedupeKey, dedupeKey } },
    });
  }
  return prisma.notification.findFirst({
    where: { dedupeKey: userIdOrDedupeKey },
  });
}

export async function findUnreadNotificationsByUserId(userId: string) {
  return prisma.notification.findMany({
    where: { userId, isChecked: false },
    orderBy: { notifiedAt: "desc" },
  });
}

export async function findNotificationById(notificationId: string) {
  return prisma.notification.findUnique({
    where: { notificationId },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { notificationId },
    data: { isChecked: true, checkedAt: new Date() },
  });
}

// SELECT FOR UPDATE SKIP LOCKED 기반 atomic batch claim.
// 트랜잭션 내에서 조회와 PROCESSING 전환이 단일 write-lock 범위 안에 있어
// 다른 worker가 같은 행을 동시에 선택하는 것을 DB 수준에서 차단한다.
export async function claimPendingOutboxesForProcessing(
  limit: number = 50,
): Promise<{ id: string; notificationId: string | null; userId: string | null }[]> {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string; notificationId: string | null; userId: string | null }[]>`
      SELECT id, "notificationId", "userId"
      FROM "NotificationOutbox"
      WHERE (
        (status IN ('PENDING', 'FAILED') AND "retryCount" < 3 AND "availableAt" <= ${now})
        OR
        (status = 'PROCESSING' AND "retryCount" < 3 AND "updatedAt" <= ${staleThreshold})
      )
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) return [];

    await tx.notificationOutbox.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { status: "PROCESSING" },
    });

    return rows;
  });
}

export async function findPendingNotificationOutboxes(limit: number = 50) {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);
  return prisma.notificationOutbox.findMany({
    where: {
      OR: [
        {
          status: { in: ["PENDING", "FAILED"] },
          retryCount: { lt: 3 },
          availableAt: { lte: now },
        },
        {
          status: "PROCESSING",
          retryCount: { lt: 3 },
          updatedAt: { lte: staleThreshold },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

// 조건부 atomic claim: 다른 worker가 이미 처리 중인 outbox는 count=0으로 반환되어 false를 리턴한다.
// 완전한 중복 처리 방지(exactly-once)가 아니라 race window를 줄이는 완화 수단이다.
export async function claimNotificationOutboxForProcessing(id: string): Promise<boolean> {
  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000);
  const result = await prisma.notificationOutbox.updateMany({
    where: {
      id,
      OR: [
        {
          status: { in: ["PENDING", "FAILED"] },
          retryCount: { lt: 3 },
          availableAt: { lte: now },
        },
        {
          status: "PROCESSING",
          retryCount: { lt: 3 },
          updatedAt: { lte: staleThreshold },
        },
      ],
    },
    data: { status: "PROCESSING" },
  });
  return result.count === 1;
}

export async function markNotificationOutboxProcessing(id: string) {
  return prisma.notificationOutbox.update({
    where: { id },
    data: { status: "PROCESSING" },
  });
}

export async function markNotificationOutboxProcessed(id: string) {
  return prisma.notificationOutbox.update({
    where: { id },
    data: { status: "PROCESSED", processedAt: new Date() },
  });
}

export async function markNotificationOutboxFailed(id: string, reason: string) {
  return prisma.notificationOutbox.update({
    where: { id },
    data: {
      status: "FAILED",
      failedAt: new Date(),
      failedReason: reason,
      retryCount: { increment: 1 },
      availableAt: new Date(Date.now() + 60_000),
    },
  });
}

export async function updateNotificationDeliveryStatus(
  notificationId: string,
  status: "SENT" | "FAILED",
  meta: { sentAt?: Date; failedAt?: Date; failedReason?: string },
) {
  return prisma.notification.update({
    where: { notificationId },
    data: { deliveryStatus: status, ...meta },
  });
}
