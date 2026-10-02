import { AdminNoticeDetailTypes, NoticeDetailProps } from '@/entities/notice/model/notice.types';

import NoticeCheck from '@/entities/notice/ui/NoticeCheck';

interface Props {
  notice: NoticeDetailProps;
  handleNotice: ({
    field,
    value,
  }: {
    field: keyof AdminNoticeDetailTypes;
    value: AdminNoticeDetailTypes[keyof AdminNoticeDetailTypes];
  }) => void;
}

export default function PinnedCheck({ notice, handleNotice }: Props) {
  return (
    <NoticeCheck
      title='중요글로 상단에 공지'
      notice={notice}
      field='isPinned'
      handleNotice={handleNotice}
    />
  );
}
