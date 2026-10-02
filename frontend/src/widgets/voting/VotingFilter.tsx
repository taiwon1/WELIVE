import Select from '@/shared/Select';
import Input from '@/shared/Input';
import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/shared/store/auth.store';
import { getApartmentDetail } from '@/entities/apartment/api/apartment.api';
import { useState, useEffect } from 'react';
import { PollStatus } from '@/entities/voting/api/voting.api';

interface OptionType {
  value: string;
  label: string;
}

interface Props {
  onChangeDong: (dong?: number) => void;
  onChangeStatus: (status?: PollStatus) => void;
  onSearchKeyword: (keyword?: string) => void;
}

export default function VotingFilter({ onSearchKeyword, onChangeStatus, onChangeDong }: Props) {
  const router = useRouter();
  const isAdminPage = router.pathname === '/admin/voting';

  const apartmentId = useAuthStore((state) => state.user?.apartmentId);

  const [dongOptions, setDongOptions] = useState<OptionType[]>([]);
  const [selectedDong, setSelectedDong] = useState<string>('-1');
  const [selectedStatus, setSelectedStatus] = useState<PollStatus | 'ALL'>('ALL');
  const [searchKeyword, setSearchKeyword] = useState<string>('');

  useEffect(() => {
    const fetchDongOptions = async () => {
      if (!apartmentId) return;

      try {
        const data = await getApartmentDetail(apartmentId);
        const { startComplexNumber, endComplexNumber, startDongNumber, endDongNumber } = data;

        const complexStart = parseInt(startComplexNumber, 10);
        const complexEnd = parseInt(endComplexNumber, 10);
        const dongStart = parseInt(startDongNumber, 10);
        const dongEnd = parseInt(endDongNumber, 10);

        const result: OptionType[] = [{ value: '-1', label: '전체' }];

        for (let complex = complexStart; complex <= complexEnd; complex++) {
          for (let dong = dongStart; dong <= dongEnd; dong++) {
            const dongNumber = `${complex}${dong.toString().padStart(2, '0')}`;
            result.push({ value: dongNumber, label: `${dongNumber}동` });
          }
        }

        setDongOptions(result);
      } catch (error) {
        console.error('동 정보 조회 실패:', error);
      }
    };

    fetchDongOptions();
  }, [apartmentId]);

  const handleDongChange = (val: string) => {
    setSelectedDong(val);
    const numVal = Number(val);
    onChangeDong(numVal > -1 ? numVal : undefined);
  };

  const handleStatusChange = (val: PollStatus | 'ALL') => {
    setSelectedStatus(val);
    onChangeStatus(val != 'ALL' ? val : undefined);
  };

  const handleSearch = () => {
    onSearchKeyword(searchKeyword);
  };

  return (
    <ul className='flex flex-col gap-[25px]'>
      <li className='mt-10 flex gap-4'>
        <div>
          <Select
            showPlaceholder={true}
            placeholder='전체'
            label='투표권자'
            options={dongOptions as { value: string; label: string }[]}
            value={selectedDong}
            onChange={handleDongChange}
          />
        </div>
        <div>
          <Select
            showPlaceholder={true}
            placeholder='전체'
            label='투표 상태'
            options={[
              { value: 'ALL', label: '전체' },
              { value: 'PENDING', label: '투표전' },
              { value: 'IN_PROGRESS', label: '투표중' },
              { value: 'CLOSED', label: '마감' },
            ]}
            value={selectedStatus}
            onChange={e => handleStatusChange(e as PollStatus | 'ALL')}
          />
        </div>
      </li>
      <li>
        <div className='flex items-center justify-between'>
          <div className='w-[375px]'>
            <Input
              label='검색'
              childrenPosition='left'
              color='search'
              placeholder='검색어를 입력해 주세요'
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            >
              <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
            </Input>
          </div>
          {isAdminPage && (
            <Link href='/admin/voting/create'>
              <Button color='primary' outline={true} label='&nbsp;'>
                주민투표 등록
              </Button>
            </Link>
          )}
        </div>
      </li>
    </ul>
  );
}
