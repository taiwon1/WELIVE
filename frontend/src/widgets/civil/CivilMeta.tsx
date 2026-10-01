import PostActionButtons from '@/entities/post/ui/PostActionButtons';
import axios from '@/shared/lib/axios';
import { useRouter } from 'next/router';

interface Props {
  date: string;
  views: number;
  commentsCount: number;
  writerId: string;
  userId: string;
  complaintId: string;
  isAdmin: boolean;
  status: string;
}

export default function CivilMeta({
  date,
  views,
  commentsCount,
  writerId,
  userId,
  complaintId,
  isAdmin,
  status,
}: Props) {
  const router = useRouter();

  const canEdit = !isAdmin && userId === writerId && status === 'PENDING';
  const canDelete = canEdit || isAdmin;

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await axios.delete(`/complaints/${complaintId}`);
      alert('삭제되었습니다.');
      router.push(isAdmin ? '/admin/civil' : '/resident/civil');
    } catch (err) {
      console.error(err);
      alert('삭제 실패');
    }
  };

  return (
    <div className='flex justify-between pt-8 pb-4.5'>
      <ul className='flex gap-4 text-[14px] text-gray-400'>
        <li className='text-gray-500'>{date}</li>
        <li className='text-gray-200'>|</li>
        <li>조회수&nbsp;&nbsp;{views}</li>
        <li className='text-gray-200'>|</li>
        <li>댓글수&nbsp;&nbsp;{commentsCount}</li>
      </ul>

      <PostActionButtons
        onEdit={canEdit ? () => router.push(`/resident/civil/edit/${complaintId}`) : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />
    </div>
  );
}
