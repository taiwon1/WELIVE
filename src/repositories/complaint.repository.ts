import prisma from '../lib/prisma';
import {
  CreateComplaintBody,
  UpdateComplaintBody,
  ComplaintListQuery,
} from '../types/complaint.types';
import { getSkip } from '../utils/pagination.util';

// 민원 단건 조회
export const findComplaintById = async (complaintId: string) => {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
    include: {
      board: { select: { apartmentId: true } },
      incidentLink: true,
      author: { select: { id: true, name: true, apartmentDong: true, apartmentHo: true } },
    },
  });

  if (!complaint) return null;

  const comments = await prisma.comment.findMany({
    where: { boardId: complaintId, boardType: 'COMPLAINT' },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return { ...complaint, comments };
};

// 민원 목록 조회
export const findComplaints = async (
  apartmentId: string,
  query: ComplaintListQuery,
  isAdmin: boolean,
  requestUserId: string,
) => {
  const { page = 1, limit = 11, status, isPublic, dong, ho, keyword, attention, unlinked } = query;

  const where: any = {
    board: { apartmentId },
  };

  if (status) where.status = status;
  if (isAdmin && attention === 'unread') where.adminReadAt = null;
  if (isAdmin && attention === 'unfinished') {
    where.AND = [{ status: { not: 'RESOLVED' } }];
  }
  if (isAdmin && unlinked) where.incidentLink = null;
  if (dong) where.dong = dong;
  if (ho) where.ho = ho;
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { author: { name: { contains: keyword, mode: 'insensitive' } } },
    ];
  }

  // 비공개 처리: 관리자는 전체 조회, 입주민은 본인 것 + 공개글만
  if (!isAdmin) {
    where.AND = [...(where.AND ?? []), { OR: [
      { isPublic: true },
      { authorId: requestUserId },
    ] }];
  } else if (isPublic !== undefined) {
    where.isPublic = isPublic;
  }

  const [complaints, totalCount] = await Promise.all([
    prisma.complaint.findMany({
      where,
      include: {
        incidentLink: true,
        author: { select: { id: true, name: true, apartmentDong: true, apartmentHo: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: getSkip(page, limit),
      take: limit,
    }),
    prisma.complaint.count({ where }),
  ]);

  return { complaints, totalCount };
};

// 민원 생성
export const createComplaint = async (authorId: string, body: CreateComplaintBody) => {
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { apartmentDong: true, apartmentHo: true },
  });

  return prisma.complaint.create({
    data: {
      title: body.title,
      content: body.content,
      isPublic: body.isPublic,
      adminReadAt: null,
      boardId: body.boardId,
      authorId,
      dong: author?.apartmentDong ?? '',
      ho: author?.apartmentHo ?? '',
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
};

// 민원 수정
export const updateComplaint = async (complaintId: string, body: UpdateComplaintBody) => {
  return prisma.complaint.update({
    where: { id: complaintId },
    data: {
      title: body.title,
      content: body.content,
      isPublic: body.isPublic,
      adminReadAt: null,
    },
    include: {
      author: { select: { id: true, name: true } },
    },
  });
};

// 민원 상태 변경
export const updateComplaintStatus = async (complaintId: string, status: string) => {
  return prisma.complaint.update({
    where: { id: complaintId },
    data: { status: status as any },
  });
};

// 민원 삭제
export const deleteComplaint = async (complaintId: string) => {
  return prisma.complaint.delete({
    where: { id: complaintId },
  });
};

// 조회수 증가
export const incrementViewsCount = async (complaintId: string) => {
  return prisma.complaint.update({
    where: { id: complaintId },
    data: { viewsCount: { increment: 1 } },
  });
};

// 댓글 수 업데이트
export const updateCommentsCount = async (complaintId: string) => {
  const count = await prisma.comment.count({
    where: { boardId: complaintId, boardType: 'COMPLAINT' },
  });
  return prisma.complaint.updateMany({
    where: { id: complaintId },
    data: { commentsCount: count },
  });
};
