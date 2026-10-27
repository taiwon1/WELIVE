import { commentRepository } from "../repositories/comment.repository.js";
import * as noticeRepository from "../repositories/notice.repository.js";
import * as complaintRepository from "../repositories/complaint.repository.js";
import {
  CreateCommentBody,
  UpdateCommentBody,
  CommentResponse,
  BoardType,
} from "../types/comment.types.js";
import { NotFoundError, ForbiddenError } from "../errors/errors.js";
import { Prisma } from "@prisma/client";
import type { UserRole } from "../types/auth.type.js";
import { getTenantActor } from "./tenant-access.service.js";
import prisma from "../lib/prisma.js";

// Prisma 반환 타입 별칭
type CommentWithAuthor = Prisma.CommentGetPayload<{
  include: { author: { select: { id: true; name: true } } };
}>;

// 응답 포맷 정제
const formatComment = (comment: CommentWithAuthor): CommentResponse => ({
  id: comment.id,
  userId: comment.authorId,
  writerName: comment.author?.name ?? "",
  content: comment.content,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  board: {
    id: comment.boardId,
    boardType: comment.boardType as CommentResponse["board"]["boardType"],
  },
});

// 댓글의 boardId는 Board가 아니라 공지/민원 글 ID다.
async function requireVisibleTarget(
  boardType: BoardType,
  boardId: string,
  apartmentId: string,
  userId: string,
  isAdmin: boolean,
) {
  if (boardType === "NOTICE") {
    const notice = await noticeRepository.findNoticeById(boardId);
    if (!notice || notice.board.apartmentId !== apartmentId) throw new NotFoundError("공지사항을 찾을 수 없습니다.");
    return;
  }
  if (boardType === "POLL") {
    const poll = await prisma.poll.findUnique({ where: { id: boardId }, include: { board: true } });
    if (!poll || poll.board.apartmentId !== apartmentId) throw new NotFoundError("투표를 찾을 수 없습니다.");
    return;
  }
  const complaint = await complaintRepository.findComplaintById(boardId);
  if (!complaint || complaint.board.apartmentId !== apartmentId) throw new NotFoundError("민원을 찾을 수 없습니다.");
  if (!complaint.isPublic && !isAdmin && complaint.authorId !== userId) {
    throw new ForbiddenError("비공개 민원은 작성자와 관리자만 열람 가능합니다.");
  }
}

// 댓글 생성
const createComment = async (
  authorId: string,
  body: CreateCommentBody,
): Promise<{ comment: CommentResponse }> => {
  const actor = await getTenantActor(authorId);
  await requireVisibleTarget(body.boardType, body.boardId, actor.apartmentId, authorId, actor.isAdmin);

  const comment = await commentRepository.createComment(authorId, body);

  try {
    if (body.boardType === "NOTICE") {
      await noticeRepository.updateCommentsCount(body.boardId);
    } else if (body.boardType === "COMPLAINT") {
      await complaintRepository.updateCommentsCount(body.boardId);
    }
  } catch (err) {
    console.error("[Comment] Failed to update commentsCount", err);
  }

  return { comment: formatComment(comment) };
};

// 댓글 수정 (본인만)
const updateComment = async (
  commentId: string,
  requestUserId: string,
  body: UpdateCommentBody,
): Promise<{ comment: CommentResponse }> => {
  const comment = await commentRepository.findCommentById(commentId);

  if (!comment) throw new NotFoundError("댓글을 찾을 수 없습니다.");
  const actor = await getTenantActor(requestUserId);
  await requireVisibleTarget(comment.boardType, comment.boardId, actor.apartmentId, requestUserId, actor.isAdmin);
  if (comment.authorId !== requestUserId)
    throw new ForbiddenError("본인 댓글만 수정할 수 있습니다.");

  const updated = await commentRepository.updateComment(commentId, body.content);
  return { comment: formatComment(updated) };
};

// 댓글 삭제 (본인 또는 관리자)
const deleteComment = async (
  commentId: string,
  requestUserId: string,
  requestUserRole: UserRole,
): Promise<void> => {
  const comment = await commentRepository.findCommentById(commentId);

  if (!comment) throw new NotFoundError("댓글을 찾을 수 없습니다.");

  const actor = await getTenantActor(requestUserId);
  await requireVisibleTarget(comment.boardType, comment.boardId, actor.apartmentId, requestUserId, actor.isAdmin);
  const isOwner = comment.authorId === requestUserId;
  const isAdmin = actor.isAdmin;

  if (!isOwner && !isAdmin)
    throw new ForbiddenError("댓글을 삭제할 권한이 없습니다.");

  await commentRepository.deleteComment(commentId);

  try {
    if (comment.boardType === "NOTICE") {
      await noticeRepository.updateCommentsCount(comment.boardId);
    } else if (comment.boardType === "COMPLAINT") {
      await complaintRepository.updateCommentsCount(comment.boardId);
    }
  } catch (err) {
    console.error("[Comment] Failed to update commentsCount after delete", err);
  }
};

export const commentService = {
  createComment,
  updateComment,
  deleteComment,
};