import { useEffect, useState } from 'react';
import axios from '@/shared/lib/axios';
import { residentInfoType } from '../type';

const ITEMS_PER_PAGE = 11;

interface Params {
  building: string;
  unitNumber: string;
  approvalStatus: string;
  keyword: string;
}

export function useResidentInfo({ building, unitNumber, approvalStatus, keyword }: Params) {
  const [rawData, setRawData] = useState<residentInfoType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get('/residents?isRegistered=true', {
          params: {
            building: building !== '전체' ? building : undefined,
            unitNumber: unitNumber !== '전체' ? unitNumber : undefined,
            name: keyword || undefined,
          },
        });
        setRawData(res.data.residents);
      } catch (error) {
        console.error('입주민 조회 실패:', error);
      }
    }

    fetchData();
  }, [building, unitNumber, keyword]);

  const filteredData =
    approvalStatus === '전체'
      ? rawData
      : rawData.filter((item) => item.approvalStatus === approvalStatus);

  const totalCount = filteredData.length;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    totalCount,
  };
}
