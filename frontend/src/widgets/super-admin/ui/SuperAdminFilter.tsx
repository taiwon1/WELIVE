import Select from '@/shared/Select';
import Input from '@/shared/Input';
import Button from '@/shared/Button';
import Image from 'next/image';
import { postRejectCleanup, updateAllAdminsApprovalStatus } from '@/entities/auth/api/admin.api';
import { ApprovalStatus } from '@/entities/auth/api/type';

type Props = {
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  statusFilter: 'all' | 'approved' | 'rejected' | 'pending';
  setStatusFilter: (status: 'all' | 'approved' | 'rejected' | 'pending') => void;
};

export default function SuperAdminFilter({
  searchKeyword,
  setSearchKeyword,
  statusFilter,
  setStatusFilter,
}: Props) {
  const handleSearch = () => {};

  const handleApproveAll = async () => {
    try {
      await updateAllAdminsApprovalStatus(ApprovalStatus.APPROVED);
      alert('전체 승인 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('전체 승인 실패');
    }
  };

  const handleRejectAll = async () => {
    try {
      await updateAllAdminsApprovalStatus(ApprovalStatus.REJECTED);
      alert('전체 거절 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('전체 거절 실패');
    }
  };

  const handleRejectCleanup = async () => {
    try {
      await postRejectCleanup();
      alert('거절 계정 정리 완료');
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('거절 계정 정리 실패');
    }
  };

  return (
    <ul className='flex flex-col gap-[25px]'>
      <li>
        <Select
          label='승인 상태'
          className='cursor-pointer'
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as 'all' | 'approved' | 'rejected' | 'pending')
          }
          options={[
            { value: 'all', label: '전체' },
            { value: 'approved', label: '승인' },
            { value: 'rejected', label: '거절' },
            { value: 'pending', label: '대기' },
          ]}
        />
      </li>
      <li>
        <div className='flex items-center justify-between'>
          <div className='w-[375px]'>
            <Input
              label='검색'
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchKeyword(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              childrenPosition='left'
              color='search'
              placeholder='검색어를 입력해 주세요'
            >
              <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
            </Input>
          </div>
          <div className='flex items-center gap-[16px]'>
            <Button
              onClick={handleApproveAll}
              outline
              label='&nbsp;'
              className='hover:bg-main hover:text-white'
            >
              대기 중인 계정 전체 승인
            </Button>
            <Button
              onClick={handleRejectAll}
              outline
              label='&nbsp;'
              className='hover:bg-main hover:text-white'
            >
              대기 중인 계정 전체 거절
            </Button>
            <Button color='secondary' outline label='&nbsp;' onClick={handleRejectCleanup}>
              거절 계정 정리
            </Button>
          </div>
        </div>
      </li>
    </ul>
  );
}
