import prisma from '../lib/prisma';
import { ForbiddenError, NotFoundError } from '../errors/errors';
import type { BoardType } from '@prisma/client';

export async function getTenantActor(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { resident: true },
  });
  if (!user || !user.isActive || user.joinStatus !== 'APPROVED') {
    throw new ForbiddenError('승인된 활성 계정만 이용할 수 있습니다.');
  }

  const apartmentId = user.role === 'ADMIN'
    ? user.apartmentId
    : user.role === 'USER' && user.resident?.residenceStatus === 'RESIDENCE'
      ? user.resident.apartmentId
      : null;
  if (!apartmentId) throw new ForbiddenError('현재 소속 단지가 필요합니다.');
  return { userId: user.id, apartmentId, isAdmin: user.role === 'ADMIN' };
}

export async function requireBoardInApartment(
  boardId: string,
  apartmentId: string,
  type: BoardType,
) {
  const board = await prisma.board.findFirst({
    where: { id: boardId, apartmentId, type },
    select: { id: true },
  });
  if (!board) throw new NotFoundError('게시판을 찾을 수 없습니다.');
}

export async function requirePollInApartment(pollId: string, apartmentId: string) {
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, board: { apartmentId } },
    select: { id: true },
  });
  if (!poll) throw new NotFoundError('투표를 찾을 수 없습니다.');
}

export async function requireOptionInApartment(optionId: string, apartmentId: string) {
  const option = await prisma.pollOption.findFirst({
    where: { id: optionId, poll: { board: { apartmentId } } },
    select: { id: true },
  });
  if (!option) throw new NotFoundError('선택지를 찾을 수 없습니다.');
}

export async function requireEventInApartment(eventId: string, apartmentId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, apartmentId },
    select: { id: true },
  });
  if (!event) throw new NotFoundError('이벤트를 찾을 수 없습니다.');
}

export async function requireEventSourceInApartment(
  boardType: 'NOTICE' | 'POLL',
  boardId: string,
  apartmentId: string,
) {
  if (boardType === 'NOTICE') {
    const notice = await prisma.notice.findFirst({
      where: { id: boardId, board: { apartmentId } },
      select: { id: true },
    });
    if (!notice) throw new NotFoundError('공지사항을 찾을 수 없습니다.');
  } else if (boardType === 'POLL') {
    await requirePollInApartment(boardId, apartmentId);
  } else {
    throw new NotFoundError('게시글을 찾을 수 없습니다.');
  }
}
