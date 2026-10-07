export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface CreateComplaintBody {
  title: string;
  content: string;
  isPublic: boolean;
  boardId: string;
}

export interface UpdateComplaintBody {
  title: string;
  content: string;
  isPublic: boolean;
}

export interface UpdateComplaintStatusBody {
  status: ComplaintStatus;
}

export interface ComplaintListItem {
  complaintId: string;
  userId: string;
  title: string;
  writerName: string;
  createdAt: Date;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  dong: string;
  ho: string;
  adminReadAt?: Date | null;
  incidentId: string | null;
}

export interface ComplaintListResponse {
  complaints: ComplaintListItem[];
  totalCount: number;
}

export interface ComplaintComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  writerName: string;
}

export interface ComplaintDetail {
  complaintId: string;
  title: string;
  category: string;
  userId: string;
  createdAt: Date;
  viewsCount: number;
  commentsCount: number;
  status: ComplaintStatus;
  content: string;
  isPublic: boolean;
  comments: ComplaintComment[];
  incidentId: string | null;
}

export interface ComplaintListQuery {
  page?: number;
  limit?: number;
  status?: ComplaintStatus;
  isPublic?: boolean;
  dong?: string;
  ho?: string;
  keyword?: string;
  attention?: 'unread' | 'unfinished';
  unlinked?: boolean;
}
