import { useState, useEffect } from 'react';
import Select from '@/shared/Select';
import Input from '@/shared/Input';
import Image from 'next/image';
import Button from '@/shared/Button';
import axios from '@/shared/lib/axios';
import { updateAllResidentsApprovalStatus } from '@/entities/auth/api/resident.api';
import { ApprovalStatus } from '@/entities/auth/api/type';

interface Props {
  building: string;
  unitNumber: string;
  approvalStatus: string;
  keyword: string;
  onBuildingChange: (val: string) => void;
  onUnitNumberChange: (val: string) => void;
  onApprovalStatusChange: (val: string) => void;
  onKeywordChange: (val: string) => void;
  onSearch: () => void;
}
interface ResidentSummary {
  approvalStatus: string;
}

interface ResidentType {
  building: string;
  unitNumber: string;
}
const extractUniqueOptions = (
  data: ResidentType[],
  key: 'building' | 'unitNumber',
  buildingFilter?: string,
) => {
  const filtered =
    key === 'unitNumber' && buildingFilter && buildingFilter !== '전체'
      ? data.filter((item) => item.building === buildingFilter)
      : data;

  const uniqueValues = Array.from(new Set(filtered.map((item) => item[key])));

  uniqueValues.sort((a, b) => Number(a) - Number(b));

  return uniqueValues.map((val) => ({
    value: val,
    label: key === 'building' ? `${String(Number(val))}동` : `${String(Number(val))}호`,
  }));
};

export default function ResidentInfoFilter({
  building,
  unitNumber,
  approvalStatus,
  keyword,
  onBuildingChange,
  onUnitNumberChange,
  onApprovalStatusChange,
  onKeywordChange,
  onSearch,
}: Props) {
  const [inputValue, setInputValue] = useState(keyword);
  const [dongOptions, setDongOptions] = useState<{ label: string; value: string }[]>([]);
  const [hoOptions, setHoOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    const fetchRegisteredResidents = async () => {
      try {
        const res = await axios.get('/residents?isRegistered=true');
        const residents: ResidentType[] = res.data.residents;

        setDongOptions(extractUniqueOptions(residents, 'building'));
        setHoOptions(extractUniqueOptions(residents, 'unitNumber', building));
      } catch (err) {
        console.error('동/호 정보 로딩 실패', err);
      }
    };
    fetchRegisteredResidents();
  }, [building]);

  const handleApproveAll = async () => {
    try {
      const res = await axios.get('/residents?isRegistered=true');
      const pending = (res.data.residents as ResidentSummary[]).filter(
        (r) => r.approvalStatus === 'PENDING',
      );

      if (pending.length === 0) {
        alert('대기 중인 계정이 없습니다.');
        return;
      }

      await updateAllResidentsApprovalStatus(ApprovalStatus.APPROVED);
      alert('전체 승인 완료');
      location.reload();
    } catch {
      alert('전체 승인 실패');
    }
  };

  const handleRejectAll = async () => {
    try {
      const res = await axios.get('/residents?isRegistered=true');
      const pending = (res.data.residents as ResidentSummary[]).filter(
        (r) => r.approvalStatus === 'PENDING',
      );

      if (pending.length === 0) {
        alert('대기 중인 계정이 없습니다.');
        return;
      }

      await updateAllResidentsApprovalStatus(ApprovalStatus.REJECTED);
      alert('전체 거절 완료');
      location.reload();
    } catch {
      alert('전체 거절 실패');
    }
  };

  const handleCleanupRejectedUsers = async () => {
    try {
      const res = await axios.get('/residents?isRegistered=true');
      const rejected = (res.data.residents as ResidentSummary[]).filter(
        (r) => r.approvalStatus === 'REJECTED',
      );

      if (rejected.length === 0) {
        alert('거절된 계정이 없습니다.');
        return;
      }

      await axios.post('/auth/cleanup');
      alert('거절 계정 정리가 완료되었습니다.');
      location.reload();
    } catch (err) {
      alert('거절 계정 정리 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  return (
    <ul className='flex flex-col gap-[25px]'>
      <li>
        <ul className='flex gap-4'>
          <li>
            <Select
              label='동'
              value={building}
              onChange={onBuildingChange}
              options={[{ value: '전체', label: '전체' }, ...dongOptions]}
            />
          </li>
          <li>
            <Select
              label='호'
              value={unitNumber}
              onChange={onUnitNumberChange}
              options={[{ value: '전체', label: '전체' }, ...hoOptions]}
            />
          </li>
          <li>
            <Select
              label='승인 상태'
              value={approvalStatus}
              onChange={onApprovalStatusChange}
              options={[
                { value: '전체', label: '전체' },
                { value: 'PENDING', label: '대기' },
                { value: 'APPROVED', label: '승인' },
                { value: 'REJECTED', label: '거절' },
              ]}
            />
          </li>
        </ul>
      </li>
      <li>
        <div className='flex items-center justify-between'>
          <div className='w-[375px]'>
            <Input
              label='검색'
              color='search'
              placeholder='검색어를 입력해 주세요'
              childrenPosition='left'
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onKeywordChange(inputValue);
                  onSearch();
                }
              }}
            >
              <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
            </Input>
          </div>
          <ul className='flex items-center gap-4'>
            <li>
              <Button label='&nbsp;' onClick={handleApproveAll}>
                대기 중인 계정 전체 승인
              </Button>
            </li>
            <li>
              <Button outline={true} label='&nbsp;' onClick={handleRejectAll}>
                대기 중인 계정 전체 거절
              </Button>
            </li>
            <li>
              <Button
                color='secondary'
                outline={true}
                label='&nbsp;'
                onClick={handleCleanupRejectedUsers}
              >
                거절 계정 관리
              </Button>
            </li>
          </ul>
        </div>
      </li>
    </ul>
  );
}
