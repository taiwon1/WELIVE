import { AdminNoticeTypes, Column } from './notice.types';

export const SELECT_OPTIONS = [
  { value: 'MAINTENANCE', label: '정기점검' },
  { value: 'EMERGENCY', label: '긴급공지' },
  { value: 'COMMUNITY', label: '커뮤니티' },
  { value: 'RESIDENT_VOTE', label: '주민투표' },
  { value: 'ETC', label: '기타' },
];

export const AdminNoticeCOLUMNS: Column<AdminNoticeTypes>[] = [
  { key: 'noticeId', title: 'NO.', width: '100px' },
  { key: 'category', title: '분류', width: '100px' },
  { key: 'title', title: '제목', width: '670px' },
  { key: 'writerName', title: '작성자', width: '180px' },
  { key: 'createdAt', title: '등록일시', width: '180px' },
  { key: 'viewsCount', title: '조회수', width: '100px' },
  { key: 'commentsCount', title: '댓글 수', width: '100px' },
  { key: 'note', title: '비고', width: '100px' },
];
