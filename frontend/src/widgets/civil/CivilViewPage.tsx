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
    comments: {
      id: string;
      userId: string;
      content: string;
      createdAt: string;
      updatedAt: string;
      writerName: string;
    }[];
  };

  const [complaint, setComplaint] = useState<ComplaintDetail | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchComplaint = async () => {
      try {
        const res = await axios.get(`/complaints/${id}`);
        setComplaint(res.data);
      } catch (error) {
        console.error('민원 데이터를 가져오는 중 오류 발생:', error);
      }
    };

    fetchComplaint();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || typeof id !== 'string' || !complaint) return;

    const currentLabel = {
      PENDING: '접수전',
      IN_PROGRESS: '처리중',
      RESOLVED: '처리완료',
    }[complaint.status];

    const newLabel = {
      PENDING: '접수전',
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

  if (!complaint) {
    return <div className='py-[100px] text-center text-gray-500'>불러오는 중...</div>;
  }

  return (
    <div className='text-gray-900'>
      <div>
        <Title category={complaint.category}>{complaint.title}</Title>
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

      {isAdmin && (
        <div className='mb-5'>
          <Select
            options={[
              { value: 'PENDING', label: '접수전' },
              { value: 'IN_PROGRESS', label: '처리중' },
              { value: 'RESOLVED', label: '처리완료' },
            ]}
            defaultValue={complaint.status}
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
