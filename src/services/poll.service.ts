import * as pollRepository from "../repositories/poll.repository";
import { NotFoundError, BadRequestError, ConflictError, ForbiddenError } from "../errors/errors";
import { createPollCreatedNotificationsForUsers } from "./notification.helper.service";
import {
  findNotificationTargetUserIdsByApartmentId,
  findUserResidentBuilding,
} from "../repositories/user.repository";
import { parsePagination } from "../utils/pagination.util";
import type {
  PollListQuery,
  CreatePollDto,
  UpdatePollDto,
  PollListResponse,
  PollDetailResponse,
  OptionWithVotes,
} from "../types/poll.types";

// 투표 목록 조회
export const getPolls = async (query: PollListQuery, apartmentId?: string): Promise<PollListResponse> => {
  const { page, limit } = parsePagination(query.page, query.limit, 11);
  const { polls, totalCount } = apartmentId
    ? await pollRepository.findPolls({ ...query, page, limit }, apartmentId)
    : await pollRepository.findPolls({ ...query, page, limit });

  return {
    polls: polls.map((poll) => ({
      pollId: poll.id,
      userId: poll.authorId,
      title: poll.title,
      writerName: poll.author.name,
      buildingPermission: poll.buildingPermission,
      createdAt: poll.createdAt,
      updatedAt: poll.updatedAt,
      startDate: poll.startDate,
      endDate: poll.endDate,
      status: poll.status,
    })),
    totalCount,
  };
};

// 투표 상세 조회
export const getPollById = async (id: string): Promise<PollDetailResponse> => {
  const poll = await pollRepository.findPollById(id);
  if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");

  return {
    pollId: poll.id,
    userId: poll.authorId,
    title: poll.title,
    writerName: poll.author.name,
    buildingPermission: poll.buildingPermission,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    startDate: poll.startDate,
    endDate: poll.endDate,
    status: poll.status,
    content: poll.content,
    boardName: poll.board.name,
    options: poll.options.map((opt) => ({
      id: opt.id,
      title: opt.title,
      voteCount: opt._count.votes,
    })),
  };
};

// 투표 생성 (관리자)
export const createPoll = async (dto: CreatePollDto, authorId: string) => {
  const startDate = new Date(dto.startDate);
  const endDate = new Date(dto.endDate);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    throw new BadRequestError("올바른 날짜 형식을 입력해주세요.");
  if (startDate >= endDate) throw new BadRequestError("시작일은 종료일보다 이전이어야 합니다.");
  if (dto.options.length < 2) throw new BadRequestError("선택지는 최소 2개 이상이어야 합니다.");

  const createdPoll = await pollRepository.createPoll({
    boardId: dto.boardId,
    authorId,
    title: dto.title,
    content: dto.content,
    buildingPermission: dto.buildingPermission,
    status: dto.status ?? "PENDING",
    startDate,
    endDate,
    options: dto.options,
  });

  try {
    const targetUserIds = await findNotificationTargetUserIdsByApartmentId({
      apartmentId: createdPoll.board.apartmentId,
      buildingPermission: createdPoll.buildingPermission,
    });
    if (targetUserIds.length > 0) {
      await createPollCreatedNotificationsForUsers({
        userIds: targetUserIds,
        pollId: createdPoll.id,
        content: `새로운 투표가 등록되었습니다: ${createdPoll.title}`,
        title: '새 투표',
      });
    }
  } catch (error) {
    console.error('[Notification] Failed to create poll notifications', error);
  }

  return { message: "정상적으로 등록 처리되었습니다" };
};

// 투표 수정 (관리자, PENDING 상태만)
export const updatePoll = async (id: string, dto: UpdatePollDto) => {
  const poll = await pollRepository.findPollById(id);
  if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");
  if (poll.status !== "PENDING") throw new BadRequestError("이미 시작된 투표는 수정할 수 없습니다.");
  if (dto.options && dto.options.length < 2)
    throw new BadRequestError("선택지는 최소 2개 이상이어야 합니다.");

  const updateData: Parameters<typeof pollRepository.updatePoll>[1] = {};
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.content !== undefined) updateData.content = dto.content;
  if (dto.buildingPermission !== undefined) updateData.buildingPermission = dto.buildingPermission;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.options !== undefined) updateData.options = dto.options;

  if (dto.startDate || dto.endDate) {
    const startDate = dto.startDate ? new Date(dto.startDate) : poll.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : poll.endDate;
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
      throw new BadRequestError("올바른 날짜 형식을 입력해주세요.");
    if (startDate >= endDate) throw new BadRequestError("시작일은 종료일보다 이전이어야 합니다.");
    if (dto.startDate) updateData.startDate = startDate;
    if (dto.endDate) updateData.endDate = endDate;
  }

  return pollRepository.updatePoll(id, updateData);
};

// 투표 삭제 (관리자, PENDING 상태만)
export const deletePoll = async (id: string) => {
  const poll = await pollRepository.findPollById(id);
  if (!poll) throw new NotFoundError("투표를 찾을 수 없습니다.");
  if (poll.status !== "PENDING") throw new BadRequestError("이미 시작된 투표는 삭제할 수 없습니다.");

  await pollRepository.deletePoll(id);
};

// 투표 참여
export const castVote = async (optionId: string, userId: string) => {
  const option = await pollRepository.findOptionById(optionId);
  if (!option) throw new NotFoundError("선택지를 찾을 수 없습니다.");
  if (option.poll.status !== "IN_PROGRESS")
    throw new BadRequestError("진행 중인 투표만 참여할 수 있습니다.");

  if (option.poll.buildingPermission !== 0) {
    const residentBuilding = await findUserResidentBuilding(userId);
    if (residentBuilding !== String(option.poll.buildingPermission)) {
      throw new ForbiddenError("해당 동 주민만 투표할 수 있습니다.");
    }
  }

  const existingVote = await pollRepository.getUserVote(userId, option.pollId);
  if (existingVote) throw new ConflictError("이미 투표에 참여했습니다.");

  await pollRepository.castVote(userId, option.pollId, optionId);

  const allOptions = await pollRepository.findOptionsWithVotes(option.pollId);
  const formattedOptions: OptionWithVotes[] = allOptions.map((opt) => ({
    id: opt.id,
    title: opt.title,
    votes: opt._count.votes,
  }));

  const updatedOption = formattedOptions.find((opt) => opt.id === optionId);
  if (!updatedOption) throw new NotFoundError("선택지를 찾을 수 없습니다.");
  const winnerOption = formattedOptions.reduce((a, b) => (a.votes >= b.votes ? a : b));

  return {
    message: "투표가 완료되었습니다.",
    updatedOption,
    winnerOption,
    options: formattedOptions,
  };
};

// 투표 취소
export const cancelVote = async (optionId: string, userId: string) => {
  const option = await pollRepository.findOptionById(optionId);
  if (!option) throw new NotFoundError("선택지를 찾을 수 없습니다.");

  const existingVote = await pollRepository.getUserVote(userId, option.pollId);
  if (!existingVote) throw new NotFoundError("투표 내역이 없습니다.");
  if (existingVote.optionId !== optionId)
    throw new BadRequestError("해당 선택지에 투표하지 않았습니다.");

  await pollRepository.cancelVote(userId, option.pollId);

  const updatedOption = await pollRepository.findOptionById(optionId);

  return {
    message: "투표가 취소되었습니다.",
    updatedOption: {
      id: optionId,
      title: option.title,
      votes: updatedOption?._count.votes ?? 0,
    },
  };
};
