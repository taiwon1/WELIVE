export interface CivilListType {
  complaintId: string;
  userId: string;
  title: string;
  writerName: string;
  createdAt: string;
  isPublic: boolean;
  viewsCount: number;
  commentsCount: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  dong: string;
  ho: string;
}
