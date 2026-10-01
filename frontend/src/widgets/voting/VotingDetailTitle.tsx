import { cn } from '@/shared/lib/helper';
import Title from '@/shared/Title';
import Image from 'next/image';
import { useRouter } from 'next/router';
import type { VotingDetail } from '@/entities/voting/type';
import { getBuildingPermission } from '@/shared/lib/getBuildingPermission';

interface VotingDetailTitleProps {
  data: VotingDetail;
}

export default function VotingDetailTitle({ data }: VotingDetailTitleProps) {
  const router = useRouter();

  const handleEdit = () => {
    router.push(`/admin/voting-edit/${data.pollId}`);
  };
  const handleDelete = () => {
    alert('투표 삭제');
  };

  const isAdminPage = router.pathname === '/admin/voting/[id]';

  const statusTextMap: Record<VotingDetail['status'], string> = {
    PENDING: '투표전',
    IN_PROGRESS: '투표중',
    CLOSED: '마감',
  };

  return (
    <div>
      <Title category='주민투표'>{data.title}</Title>
      <div className='mt-[30px] flex w-full items-center justify-between border-b border-gray-100 pb-[16px] text-[14px]'>
        <div className='flex items-center gap-[12px]'>
          <span className={cn('text-main', status === 'CLOSED' && 'text-gray-400')}>
            {statusTextMap[data.status]}
          </span>
          <span className='text-gray-200'>|</span>
          <span className='text-gray-500'>투표권자</span>
          <span className='text-gray-400'>{getBuildingPermission(data.buildingPermission)}</span>
        </div>
        {isAdminPage && (
          <div className='flex items-center gap-[16px]'>
            <button className='cursor-pointer' onClick={handleEdit}>
              <Image src='/img/edit.svg' alt='투표 수정 버튼' width={20} height={20} />
            </button>
            <button className='cursor-pointer' onClick={handleDelete}>
              <Image src='/img/delete.svg' alt='투표 삭제 버튼' width={20} height={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
