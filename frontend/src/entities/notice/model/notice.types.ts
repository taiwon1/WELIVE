import { Dispatch, SetStateAction } from 'react';

export interface BaseRowData {
  noticeId: string;
}

export interface AdminNoticeTypes {
  noticeId: string;
  category: string;
  title: string;
  writerName: string;
  createdAt: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  note?: boolean;
}

export interface AdminNoticeDetailTypes {
  noticeId: string;
  category: string;
  title: string;
  writerName: string;
  date: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  content: string;
  boardName: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateAdminNoticeProps {
  category: string;
  title: string;
  content: string;
  boardId: string;
  isPinned: boolean;
  startDate: string;
  endDate: string;
}

export type NoticeCategory =
  | 'MAINTENANCE'
  | 'EMERGENCY'
  | 'COMMUNITY'
  | 'RESIDENT_VOTE'
  | 'RESIDENT_COUNCIL'
  | 'ETC';

export interface ResidentNoticeTypes {
  noticeId: string;
  no: number;
  category: NoticeCategory;
  title: string;
  writerName: string;
  createdAt: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
}

export interface NoticeSelectProps {
  label: string;
  defaultOption?: string;
  handleNotice: (params: EditNoticeParam) => void;
}

export interface NoticeCalendarOpenProps {
  calendarOpen: boolean;
  setCalendarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleNotice: (params: EditNoticeParam) => void;
}

export interface NoticeCheckProps {
  title: string;
  field?: 'isPinned';
  notice?: Partial<AdminNoticeDetailTypes> | null;
  setNotice?: Dispatch<SetStateAction<AdminNoticeDetailTypes>>;
  handleNotice: (params: EditNoticeParam) => void;
}

export interface EditNoticeParam {
  field: keyof AdminNoticeDetailTypes;
  value: AdminNoticeDetailTypes[keyof AdminNoticeDetailTypes];
}
export interface NoticeMainProps {
  notice?: AdminNoticeDetailTypes | NoticeDetailProps | null;
  handleNotice: (params: EditNoticeParam) => void;
  handleSubmit: () => void;
  isDisabled?: boolean;
  text: string;
}

// 공지사항 전용 타입
export interface NoticeRowData extends BaseRowData {
  category: string;
  title: string;
  writerName: string;
  date: string;
  viewsCount: number;
  commentsCount: number;
  note: string;
}

// 제네릭 컬럼 타입
export interface Column<T> {
  title: string;
  key: keyof T;
  width: string | number;
}

// 주민 전용 타입
export interface ResidentRowData extends BaseRowData {
  dong: string;
  ho: string;
  name: string;
  contact: string;
  residenceStatus: string;
  weliveStatus: string;
  note: string;
}

export interface AdminTableProps {
  data: AdminNoticeTypes[];
  noticeCount: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  editClick: (row: AdminNoticeTypes) => void;
  deleteClick: (row: AdminNoticeTypes) => void;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  writerName: string;
  board: {
    id: string;
    boardType: string;
  };
}

export interface NoticeDetailProps {
  noticeId: string;
  category: string;
  title: string;
  startDate: string;
  endDate: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  content: string;
  boardName: string;
  comments: Comment[];
  createdAt: string;
  date?: string;
}
