import VotingStatusChip from '@/entities/voting/ui/VotingStatusChip';
import { VotingList } from '@/entities/voting/type';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { getBuildingPermission } from '@/shared/lib/getBuildingPermission';
import { deleteVoting } from '@/entities/voting/api/voting.api';
import { useAuthStore } from '@/shared/store/auth.store';

type Props = {
  data: VotingList[];
  currentPage: number;
  itemsPerPage: number;
  totalCount: number;
};

export default function VotingTable({ data, currentPage, itemsPerPage, totalCount }: Props) {
  const router = useRouter();
  const isAdminPage = router.pathname === '/admin/voting';
  const now = new Date();

  const tdClass = 'p-3 text-center text-gray-500';
  const thClass = 'p-3 font-medium';

  const formatISODateToDisplay = (isoString: string) => {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  const isVotingInProgress = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return now >= startDate && now <= endDate;
  };

  const isVotingEnded = (end: string) => {
    const endDate = new Date(end);
    return now > endDate;
  };

  const handleEdit = (pollId: string, startDate: string, endDate: string) => {
    if (isVotingInProgress(startDate, endDate)) {
      alert('투표 진행 중에는 수정을 할 수 없습니다.');
      return;
    }
    if (isVotingEnded(endDate)) {
      alert('마감된 투표는 수정을 할 수 없습니다.');
      return;
    }

    router.push(`/admin/voting/edit/${pollId}`);
  };

  const handleDelete = async (pollId: string, startDate: string, endDate: string) => {
    if (isVotingInProgress(startDate, endDate)) {
      alert('투표 진행 중에는 삭제를 할 수 없습니다.');
      return;
    }
    if (isVotingEnded(endDate)) {
      alert('마감된 투표는 삭제를 할 수 없습니다.');
      return;
    }

    const confirm = window.confirm('정말로 이 투표를 삭제하시겠습니까?');
    if (!confirm) return;

    try {
      await deleteVoting(pollId);
      alert('삭제가 완료되었습니다.');
      location.reload();
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  return (
    <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
      <table className='w-full table-fixed'>
        <colgroup>
          <col style={{ width: '100px' }} />
          <col style={{ width: '318px' }} />
          <col style={{ width: '180px' }} />
          <col style={{ width: '180px' }} />
          <col />
          <col />
          <col />
          <col style={{ width: '100px' }} />
          {isAdminPage && <col style={{ width: '100px' }} />}
        </colgroup>
        <thead>
          <tr>
            <th className={thClass}>No.</th>
            <th className={thClass}>제목</th>
            <th className={thClass}>작성자</th>
            <th className={thClass}>투표권자</th>
            <th className={thClass}>작성일시</th>
            <th className={thClass}>투표시작</th>
            <th className={thClass}>투표종료</th>
            <th className={thClass}>투표상태</th>
            {isAdminPage && <th className={thClass}>비고</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={isAdminPage ? 9 : 8} className='py-10 text-center text-gray-400'>
                아직 투표가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={item.pollId}>
                <td className={tdClass}>
                  {totalCount - ((currentPage - 1) * itemsPerPage + index)}
                </td>
                <td className={`${tdClass} hover:text-main`}>
                  <Link
                    href={
                      isAdminPage
                        ? `/admin/voting/detail/${item.pollId}`
                        : `/resident/voting/detail/${item.pollId}`
                    }
                  >
                    <div className='line-clamp-1' title={item.title}>
                      {item.title}
                    </div>
                  </Link>
                </td>
                <td className={tdClass}>{item.writerName}</td>
                <td className={tdClass}>{getBuildingPermission(item.buildingPermission)}</td>
                <td className={tdClass}>{formatISODateToDisplay(item.createdAt)}</td>
                <td className={tdClass}>{formatISODateToDisplay(item.startDate)}</td>
                <td className={tdClass}>{formatISODateToDisplay(item.endDate)}</td>
                <td className={tdClass}>
                  <VotingStatusChip type='process' status={item.status} />
                </td>
                {isAdminPage && (
                  <td className={tdClass}>
                    <div className='flex items-center justify-center gap-4'>
                      {item.userId === useAuthStore.getState().user?.id && (
                        <button
                          onClick={() => handleEdit(item.pollId, item.startDate, item.endDate)}
                          className='cursor-pointer'
                        >
                          <Image src='/img/edit.svg' alt='투표 수정' width={20} height={20} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(item.pollId, item.startDate, item.endDate)}
                        className='cursor-pointer'
                      >
                        <Image src='/img/delete.svg' alt='투표 삭제' width={20} height={20} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
