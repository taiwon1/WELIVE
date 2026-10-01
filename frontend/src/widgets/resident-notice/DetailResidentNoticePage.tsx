import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { fetchResidentNoticeDetail } from '@/entities/notice/api/noticeApi';
import CommentSection from '@/shared/comments/ui/CommentSection';
import { BoardType } from '@/shared/comments/api/comment.api';

type NoticeDetail = {
  title: string;
  category: string;
  createdAt: string;
  viewsCount: number;
  commentsCount: number;
  isPinned: boolean;
  content: string;
  boardName: string;
  comments: {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    writerName: string;
  }[];
};

const CATEGORY_LABEL_MAP = {
  MAINTENANCE: '정기점검',
  EMERGENCY: '긴급점검',
  COMMUNITY: '공동생활',
  RESIDENT_VOTE: '주민투표',
  RESIDENT_COUNCIL: '주민회의',
  ETC: '기타',
} as const;

export default function DetailResidentNoticePage() {
  const router = useRouter();
  const { id: noticeId } = router.query;
  const [notice, setNotice] = useState<NoticeDetail | null>(null);

  useEffect(() => {
    if (!noticeId || typeof noticeId !== 'string') return;

    const fetchData = async () => {
      try {
        const data = await fetchResidentNoticeDetail(noticeId);
        setNotice(data);
      } catch (err) {
        console.error('상세 공지사항 불러오기 실패', err);
      }
    };

    fetchData();
  }, [noticeId]);

  if (!notice) {
    return <div className='py-[100px] text-center text-gray-500'>불러오는 중...</div>;
  }

  return (
    <div className='text-gray-900'>
      <div className='border-b border-gray-200'>
        <div className='mb-5 text-sm text-gray-500'>공지사항</div>
        <h2 className='text-[26px] font-bold'>{notice.title}</h2>
        <div className='flex justify-between pt-8 pb-4.5'>
          <ul className='flex gap-4 text-[14px] text-gray-400'>
            <li className='text-main'>
              {CATEGORY_LABEL_MAP[notice.category as keyof typeof CATEGORY_LABEL_MAP]}
            </li>
            <li className='text-gray-200'>|</li>
            <li className='text-gray-500'>{notice.createdAt}</li>
            <li className='text-gray-200'>|</li>
            <li>조회수&nbsp;&nbsp;{notice.viewsCount}</li>
            <li className='text-gray-200'>|</li>
            <li>댓글수&nbsp;&nbsp;{notice.commentsCount}</li>
          </ul>
        </div>
      </div>

      <div className='mt-[40px] mb-[90px] text-lg leading-relaxed whitespace-pre-wrap'>
        {notice.content}
      </div>
      <CommentSection
        initialComments={notice.comments}
        boardId={noticeId as string}
        commentCount={notice.commentsCount}
        boardType={BoardType.NOTICE}
      />
    </div>
  );
}
