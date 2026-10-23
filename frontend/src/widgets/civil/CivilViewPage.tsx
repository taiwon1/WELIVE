import { useRouter } from 'next/router';
import Title from '@/shared/Title';
import CivilMeta from './CivilMeta';
import CivilContent from './CivilContent';
import Select from '@/shared/Select';
import { useEffect, useState } from 'react';
import axios from '@/shared/lib/axios';
import CommentSection from '@/shared/comments/ui/CommentSection';
import { useAuthStore } from '@/shared/store/auth.store';
import { BoardType } from '@/shared/comments/api/comment.api';
import Link from 'next/link';

export default function CivilViewPage() {
  const { pathname } = useRouter();
  const isAdmin = pathname.includes('/admin');
  const router = useRouter();
  const { id } = router.query;
  const user = useAuthStore((state) => state.user);

  type ComplaintDetail = {
    title: string;
    category: string;
    userId: string;
    createdAt: string;
    viewsCount: number;
    commentsCount: number;
    status: string;
    content: string;
    incidentId?: string | null;
    comments: {
      id: string;
      userId: string;
      content: string;
      createdAt: string;
      updatedAt: string;
      writerName: string;
    }[];
  };

  const [loadError, setLoadError] = useState(false);
  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    let active = true;
    setLoadError(false);
    setComplaint(null);
    const fetchComplaint = async () => {
      try {
        const res = await axios.get(`/complaints/${id}`);
        if (active) setComplaint(res.data);
      } catch (error) {
        console.error('민원 데이터를 가져오는 중 오류 발생:', error);
        if (active) setLoadError(true);
      }
    };

    fetchComplaint();
    return () => { active = false; };
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || typeof id !== 'string' || !complaint) return;

    const currentLabel = {
      PENDING: '처리 대기',
      IN_PROGRESS: '처리중',
      RESOLVED: '처리완료',
    }[complaint.status];

    const newLabel = {
      PENDING: '처리 대기',
      IN_PROGRESS: '처리중',
      RESOLVED: '처리완료',
    }[newStatus];

    const confirmed = window.confirm(
      `상태를 "${currentLabel}"에서 "${newLabel}"(으)로 변경하시겠습니까?`,
    );
    if (!confirmed) return;

    try {
      await axios.patch(`/complaints/${id}/status`, {
        status: newStatus,
      });

      const res = await axios.get(`/complaints/${id}`);
      setComplaint(res.data);

      window.alert(`상태가 "${currentLabel}"에서 "${newLabel}"(으)로 변경되었습니다.`);
    } catch (err) {
      console.error('상태 변경 실패:', err);
      window.alert('상태 변경에 실패했습니다.');
    }
  };

  if (loadError) {
    return <div role='alert' className='py-16 text-center'>
      <p>민원을 볼 수 없습니다. 삭제되었거나 열람 권한이 없을 수 있습니다.</p>
      <Link className='mt-4 inline-block min-h-11 underline' href={isAdmin ? '/admin/civil' : '/resident/civil'}>민원 목록으로 돌아가기</Link>
    </div>;
  }
  if (!complaint) {
    return <div className='py-[100px] text-center text-gray-500'>불러오는 중...</div>;
  }

  return (
    <div className='text-gray-900'>
      <div>
        <Title category={complaint.category === 'COMPLAINT' ? '민원' : complaint.category}>{complaint.title}</Title>
        <CivilMeta
          date={complaint.createdAt}
          views={complaint.viewsCount}
          commentsCount={complaint.commentsCount}
          writerId={complaint.userId}
          userId={user?.id as string}
          complaintId={id as string}
          isAdmin={isAdmin}
          status={complaint.status}
        />
      </div>

      <CivilContent content={complaint.content} />

      {complaint.incidentId && (
        <p className='mb-5 rounded-xl bg-blue-50 p-4'>
          이 민원은 공동 문제와 함께 처리됩니다.{' '}
          <Link
            className='inline-block min-h-11 content-center font-semibold underline'
            href={'/' + (isAdmin ? 'admin' : 'resident') + '/incidents/' + complaint.incidentId}
          >
            공동 문제의 처리 상황 보기
          </Link>
        </p>
      )}
      {isAdmin && !complaint.incidentId && (
        <div className='mb-5'>
          <Select
            options={[
              { value: 'PENDING', label: '처리 대기' },
              { value: 'IN_PROGRESS', label: '처리중' },
              { value: 'RESOLVED', label: '처리완료' },
            ]}
            value={complaint.status}
            small={true}
            onChange={handleStatusChange}
          />
        </div>
      )}

      <CommentSection
        initialComments={complaint.comments}
        boardId={id as string}
        commentCount={complaint.comments.length}
        boardType={BoardType.COMPLAINT}
      />
    </div>
  );
}
