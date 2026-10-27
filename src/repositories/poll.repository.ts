import prisma from "../lib/prisma";
import { getSkip } from "../utils/pagination.util";
import type { PollListQuery, PollOptionInput } from "../types/poll.types";

// 투표 목록 조회
export const findPolls = async (query: PollListQuery & { page: number; limit: number }, apartmentId?: string) => {
  const { status, buildingPermission, keyword, page, limit } = query;

  const where = {
    ...(apartmentId && { board: { apartmentId } }),
    ...(status && { status }),
    ...(buildingPermission !== undefined && { buildingPermission }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: "insensitive" as const } },
        { content: { contains: keyword, mode: "insensitive" as const } },
      ],
    }),
  };

  const [polls, totalCount] = await Promise.all([
    prisma.poll.findMany({
      where,
      skip: getSkip(page, limit),
      take: limit,
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.poll.count({ where }),
  ]);

  return { polls, totalCount };
};

// 투표 상세 조회
export const findPollById = async (id: string) => {
  return prisma.poll.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      board: { select: { name: true } },
      options: {
        include: { _count: { select: { votes: true } } },
      },
    },
  });
};

// 투표 생성
export const createPoll = async (data: {
  boardId: string;
  authorId: string;
  title: string;
  content: string;
  buildingPermission: number;
  status: "PENDING" | "IN_PROGRESS" | "CLOSED";
  startDate: Date;
  endDate: Date;
  options: PollOptionInput[];
}) => {
  const { options, ...rest } = data;
  return prisma.poll.create({
    data: {
      ...rest,
      options: { create: options.map(({ title }) => ({ title })) },
    },
    include: { board: { select: { apartmentId: true } } },
  });
};

// 투표 수정
export const updatePoll = async (
  id: string,
  data: {
    title?: string;
    content?: string;
    buildingPermission?: number;
    startDate?: Date;
    endDate?: Date;
    status?: "PENDING" | "IN_PROGRESS" | "CLOSED";
    options?: PollOptionInput[];
  },
) => {
  const { options, ...rest } = data;
  return prisma.$transaction(async (tx) => {
    if (options) {
      await tx.pollOption.deleteMany({ where: { pollId: id } });
      await tx.pollOption.createMany({
        data: options.map(({ title }) => ({ title, pollId: id })),
      });
    }
    return tx.poll.update({ where: { id }, data: rest });
  });
};

// 투표 삭제
export const deletePoll = async (id: string) => {
  return prisma.poll.delete({ where: { id } });
};

// 상태 업데이트
export const updatePollStatus = async (id: string, status: string) => {
  return prisma.poll.update({
    where: { id },
    data: { status: status as "PENDING" | "IN_PROGRESS" | "CLOSED" },
  });
};

// 선택지 조회 (pollId 포함)
export const findOptionById = async (optionId: string) => {
  return prisma.pollOption.findUnique({
    where: { id: optionId },
    include: {
      poll: true,
      _count: { select: { votes: true } },
    },
  });
};

// 특정 투표의 모든 선택지 + 득표수
export const findOptionsWithVotes = async (pollId: string) => {
  return prisma.pollOption.findMany({
    where: { pollId },
    include: { _count: { select: { votes: true } } },
  });
};

// 투표 참여
export const castVote = async (userId: string, pollId: string, optionId: string) => {
  return prisma.vote.create({ data: { userId, pollId, optionId } });
};

// 투표 취소
export const cancelVote = async (userId: string, pollId: string) => {
  return prisma.vote.deleteMany({ where: { userId, pollId } });
};

// 유저 투표 여부 확인
export const getUserVote = async (userId: string, pollId: string) => {
  return prisma.vote.findUnique({
    where: { userId_pollId: { userId, pollId } },
  });
};

// 스케줄러: PENDING → IN_PROGRESS 대상
export const findPendingToStart = async () => {
  return prisma.poll.findMany({
    where: { status: "PENDING", startDate: { lte: new Date() } },
  });
};

// 스케줄러: IN_PROGRESS → CLOSED 대상
export const findInProgressToClose = async () => {
  return prisma.poll.findMany({
    where: { status: "IN_PROGRESS", endDate: { lt: new Date() } },
    include: {
      board: { include: { apartment: { include: { boards: true } } } },
      options: { include: { _count: { select: { votes: true } } } },
    },
  });
};
