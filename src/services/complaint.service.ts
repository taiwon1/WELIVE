import * as complaintRepository from '../repositories/complaint.repository';
import {
  createComplaintCreatedNotification,
  createComplaintResolvedNotification,
} from './notification.helper.service';
import {
  CreateComplaintBody,
  UpdateComplaintBody,
  UpdateComplaintStatusBody,
  ComplaintListQuery,
  ComplaintDetail,
  ComplaintListItem,
  ComplaintListResponse,
} from '../types/complaint.types';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../errors/errors';
import prisma from '../lib/prisma';

// 응답 포맷 - 목록
const formatComplaintListItem = (complaint: any, isAdmin: boolean, userId: string): ComplaintListItem => ({
  complaintId: complaint.id,
  userId: complaint.authorId,
  title: complaint.title,
  writerName: complaint.author?.name ?? '',
  createdAt: complaint.createdAt,
  isPublic: complaint.isPublic,
  viewsCount: complaint.viewsCount,
  commentsCount: complaint._count?.comments ?? complaint.commentsCount ?? 0,
  status: complaint.status,
  dong: complaint.dong ?? '',
  ho: complaint.ho ?? '',
  ...(isAdmin && { adminReadAt: complaint.adminReadAt }),
  incidentId: isAdmin || complaint.authorId === userId ? complaint.incidentLink?.incidentId ?? null : null,
});

// 응답 포맷 - 상세
const formatComplaintDetail = (complaint: any, showIncident: boolean): ComplaintDetail => ({
  complaintId: complaint.id,
  title: complaint.title,
  category: 'COMPLAINT',
  userId: complaint.authorId,
  createdAt: complaint.createdAt,
  viewsCount: complaint.viewsCount,
  commentsCount: complaint._count?.comments ?? complaint.comments?.length ?? 0,
  status: complaint.status,
  content: complaint.content,
  isPublic: complaint.isPublic,
  incidentId: showIncident ? complaint.incidentLink?.incidentId ?? null : null,
  comments: (complaint.comments ?? []).map((c: any) => ({
    id: c.id,
    userId: c.authorId,
    content: c.content,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    writerName: c.author?.name ?? '',
  })),
});

async function currentActor(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { resident: true } });
  if (!user || !user.isActive || user.joinStatus !== 'APPROVED') {
    throw new ForbiddenError('승인된 활성 계정만 이용할 수 있습니다.');
  }
  const isAdmin = user.role === 'ADMIN';
  const apartmentId = isAdmin ? user.apartmentId :
    user.role === 'USER' && user.resident?.residenceStatus === 'RESIDENCE' ? user.resident.apartmentId : null;
  if (!apartmentId) throw new ForbiddenError('현재 소속 단지가 필요합니다.');
  return { isAdmin, apartmentId };
}

// boardId로 관리자 ID 조회
const getAdminIdByBoardId = async (boardId: string): Promise<string | null> => {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      apartment: {
        include: { admin: { select: { id: true } } },
      },
    },
  });
  return board?.apartment?.admin?.id ?? null;
};

// 민원 목록 조회
export const getComplaints = async (
  apartmentId: string,
  query: ComplaintListQuery,
  isAdmin: boolean,
  requestUserId: string,
): Promise<ComplaintListResponse> => {
  const actor = await currentActor(requestUserId);
  if (actor.apartmentId !== apartmentId) throw new ForbiddenError('소속 단지를 확인해주세요.');
  isAdmin = actor.isAdmin;
  const { complaints, totalCount } = await complaintRepository.findComplaints(
    apartmentId,
    query,
    isAdmin,
    requestUserId,
  );

  return {
    complaints: complaints.map(item => formatComplaintListItem(item, isAdmin, requestUserId)),
    totalCount,
  };
};

// 민원 상세 조회
export const getComplaintById = async (
  complaintId: string,
  requestUserId: string,
  isAdmin: boolean,
): Promise<ComplaintDetail> => {
  const complaint = await complaintRepository.findComplaintById(complaintId);

  if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

  const actor = await currentActor(requestUserId);
  if (actor.apartmentId !== complaint.board.apartmentId) throw new NotFoundError('민원을 찾을 수 없습니다.');
  isAdmin = actor.isAdmin;

  // 비공개 글 접근 권한 체크
  if (!complaint.isPublic && !isAdmin && complaint.authorId !== requestUserId) {
    throw new ForbiddenError('비공개 민원은 작성자와 관리자만 열람 가능합니다.');
  }

  // 조회수 증가
  if (isAdmin) {
    await prisma.complaint.updateMany({
      where: { id: complaintId, adminReadAt: null, updatedAt: complaint.updatedAt },
      data: { adminReadAt: new Date() },
    });
  }
  await complaintRepository.incrementViewsCount(complaintId);

  return formatComplaintDetail({ ...complaint, viewsCount: complaint.viewsCount + 1 }, isAdmin || complaint.authorId === requestUserId);
};

// 민원 등록
export const createComplaint = async (
  authorId: string,
  body: CreateComplaintBody,
) => {
  const complaint = await complaintRepository.createComplaint(authorId, body);

  // boardId로 관리자 ID 조회 후 알림 전송
  const adminId = await getAdminIdByBoardId(body.boardId);

  if (adminId) {
    await createComplaintCreatedNotification({
      userId: adminId,
      complaintId: complaint.id,
      content: '새로운 민원이 등록되었습니다.',
      title: '새 민원 등록',
    });
  }

  return complaint;
};

// 민원 수정
export const updateComplaint = async (
  complaintId: string,
  requestUserId: string,
  body: UpdateComplaintBody,
) => {
  const complaint = await complaintRepository.findComplaintById(complaintId);

  if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');
  if (complaint.authorId !== requestUserId)
    throw new ForbiddenError('본인이 작성한 민원만 수정할 수 있습니다.');
  if (complaint.status !== 'PENDING')
    throw new BadRequestError('처리 중이거나 완료된 민원은 수정할 수 없습니다.');

  return complaintRepository.updateComplaint(complaintId, body);
};

// 민원 상태 변경 (관리자 전용)
export const updateComplaintStatus = async (
  complaintId: string,
  body: UpdateComplaintStatusBody,
  requestUserId: string,
) => {
  const actor = await currentActor(requestUserId);
  if (!actor.isAdmin) throw new ForbiddenError('관리자만 변경할 수 있습니다.');
  const complaint = await prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "Complaint" WHERE id = ${complaintId} FOR UPDATE`;
    const row = await tx.complaint.findUnique({ where: { id: complaintId }, include: { board: true, incidentLink: true } });
    if (!row || row.board.apartmentId !== actor.apartmentId) throw new NotFoundError('민원을 찾을 수 없습니다.');
    if (row.incidentLink) throw new ConflictError('연결된 공동 문제에서 처리 상태를 변경해주세요.');
    await tx.complaint.update({ where: { id: complaintId }, data: { status: body.status, adminReadAt: new Date() } });
    return row;
  });

  if (complaint.status !== 'RESOLVED' && body.status === 'RESOLVED') {
    await createComplaintResolvedNotification({
      userId: complaint.authorId,
      complaintId,
      content: '민원이 처리 완료되었습니다.',
      title: '민원 처리 완료',
    });
  }

  return { message: '민원 상태가 변경되었습니다.' };
};

// 민원 삭제
export const deleteComplaint = async (
  complaintId: string,
  requestUserId: string,
  isAdmin: boolean,
) => {
  const complaint = await complaintRepository.findComplaintById(complaintId);

  if (!complaint) throw new NotFoundError('민원을 찾을 수 없습니다.');

  const isOwner = complaint.authorId === requestUserId;

  if (!isOwner && !isAdmin)
    throw new ForbiddenError('민원을 삭제할 권한이 없습니다.');

  if (!isAdmin && complaint.status !== 'PENDING')
    throw new BadRequestError('처리 중이거나 완료된 민원은 삭제할 수 없습니다.');

  await complaintRepository.deleteComplaint(complaintId);

  return { message: '정상적으로 삭제 처리되었습니다.' };
};
