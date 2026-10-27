import * as noticeRepository from "../repositories/notice.repository";
import { createNoticeCreatedNotificationsForUsers } from "./notification.helper.service";
import { findNotificationTargetUserIdsByApartmentId } from "../repositories/user.repository";
import prisma from "../lib/prisma";
import {
  CreateNoticeBody,
  UpdateNoticeBody,
  NoticeListQuery,
  NoticeListResponse,
  NoticeDetail,
  NoticeListItem,
} from "../types/notice.types";
import { NotFoundError, ForbiddenError } from "../errors/errors";
import { getTenantActor, requireBoardInApartment } from "./tenant-access.service";

// 응답 포맷 - 목록
const formatNoticeListItem = (notice: any): NoticeListItem => ({
  noticeId: notice.id,
  userId: notice.authorId,
  category: notice.category,
  title: notice.title,
  writerName: notice.author?.name ?? "",
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt,
  viewsCount: notice.viewsCount,
  commentsCount: notice.commentsCount,
  isPinned: notice.isPinned,
});

// 응답 포맷 - 상세
const formatNoticeDetail = (notice: any): NoticeDetail => ({
  noticeId: notice.id,
  userId: notice.authorId,
  category: notice.category,
  title: notice.title,
  writerName: notice.author?.name ?? "",
  createdAt: notice.createdAt,
  updatedAt: notice.updatedAt,
  viewsCount: notice.viewsCount,
  commentsCount: notice.commentsCount,
  isPinned: notice.isPinned,
  content: notice.content,
  boardName: notice.board?.name ?? "",
  startDate: notice.startDate,
  endDate: notice.endDate,
  comments: (notice.comments ?? []).map((c: any) => ({
    id: c.id,
    userId: c.authorId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    writerName: c.author?.name ?? '',
    board: { id: c.boardId, boardType: c.boardType },
  })),
});

// 공지사항 목록 조회
export const getNotices = async (
  apartmentId: string,
  query: NoticeListQuery,
  requestUserId: string,
): Promise<NoticeListResponse> => {
  const actor = await getTenantActor(requestUserId);
  if (actor.apartmentId !== apartmentId) throw new ForbiddenError('소속 단지를 확인해주세요.');
  const { notices, totalCount } = await noticeRepository.findNotices(apartmentId, query);
  return {
    notices: notices.map(formatNoticeListItem),
    totalCount,
  };
};

// 공지사항 상세 조회
export const getNoticeById = async (noticeId: string, requestUserId: string): Promise<NoticeDetail> => {
  const actor = await getTenantActor(requestUserId);
  const notice = await noticeRepository.findNoticeById(noticeId);
  if (!notice || notice.board.apartmentId !== actor.apartmentId) throw new NotFoundError("공지사항을 찾을 수 없습니다.");

  await noticeRepository.incrementViewsCount(noticeId);

  return formatNoticeDetail({ ...notice, viewsCount: notice.viewsCount + 1 });
};

// 공지사항 등록
export const createNotice = async (authorId: string, body: CreateNoticeBody) => {
  const actor = await getTenantActor(authorId);
  if (!actor.isAdmin) throw new ForbiddenError('관리자만 공지를 등록할 수 있습니다.');
  await requireBoardInApartment(body.boardId, actor.apartmentId, 'NOTICE');
  const notice = await noticeRepository.createNotice(authorId, body);

  const apartmentId = (notice as any).board?.apartmentId;
  if (apartmentId) {
    try {
      const userIds = await findNotificationTargetUserIdsByApartmentId({ apartmentId });
      if (userIds.length > 0) {
        await createNoticeCreatedNotificationsForUsers({
          userIds,
          noticeId: notice.id,
          content: `새로운 공지사항이 등록되었습니다: ${notice.title}`,
          title: "새 공지",
        });
      }
    } catch (err) {
      console.error("[Notice] Failed to send notice notifications", err);
    }
  }

  if (body.startDate) {
    try {
      const board = await prisma.board.findUnique({
        where: { id: body.boardId },
        select: { apartmentId: true },
      });
      if (board) {
        await prisma.event.create({
          data: {
            title: notice.title,
            category: notice.category,
            type: "NOTICE",
            boardType: "NOTICE",
            boardId: notice.id,
            apartmentId: board.apartmentId,
            start: new Date(body.startDate),
            end: body.endDate ? new Date(body.endDate) : new Date(body.startDate),
          },
        });
      }
    } catch (err) {
      console.error("[Notice] Failed to create event", err);
    }
  }

  return { message: "정상적으로 등록 처리되었습니다" };
};

// 공지사항 수정
export const updateNotice = async (noticeId: string, body: UpdateNoticeBody, requestUserId: string) => {
  const actor = await getTenantActor(requestUserId);
  if (!actor.isAdmin) throw new ForbiddenError('관리자만 공지를 수정할 수 있습니다.');
  const notice = await noticeRepository.findNoticeById(noticeId);
  if (!notice || notice.board.apartmentId !== actor.apartmentId) throw new NotFoundError("공지사항을 찾을 수 없습니다.");
  if (body.boardId) await requireBoardInApartment(body.boardId, actor.apartmentId, 'NOTICE');

  const updated = await noticeRepository.updateNotice(noticeId, body);
  return formatNoticeListItem(updated);
};

// 공지사항 삭제
export const deleteNotice = async (noticeId: string, requestUserId: string) => {
  const actor = await getTenantActor(requestUserId);
  if (!actor.isAdmin) throw new ForbiddenError('관리자만 공지를 삭제할 수 있습니다.');
  const notice = await noticeRepository.findNoticeById(noticeId);
  if (!notice || notice.board.apartmentId !== actor.apartmentId) throw new NotFoundError("공지사항을 찾을 수 없습니다.");

  await noticeRepository.deleteNotice(noticeId);
  return { message: "정상적으로 삭제 처리되었습니다" };
};
