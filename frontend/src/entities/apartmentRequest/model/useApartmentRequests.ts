import { useEffect, useMemo, useState } from 'react';
import { getApartmentRequests } from '@/entities/apartmentRequest/api/apartment.api';
import { ApartmentRequest } from '../type';

const ITEMS_PER_PAGE = 11;

export function useApartmentRequests() {
  const [data, setData] = useState<ApartmentRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'rejected' | 'pending'>(
    'all',
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getApartmentRequests();
        setData(res);
      } catch (error) {
        console.error('아파트 요청 목록 불러오기 실패:', error);
      }
    };

    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.name.includes(searchKeyword) ||
        item.adminName.includes(searchKeyword) ||
        item.address.includes(searchKeyword) ||
        item.adminEmail.includes(searchKeyword);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'approved' && item.apartmentStatus === 'APPROVED') ||
        (statusFilter === 'rejected' && item.apartmentStatus === 'REJECTED') ||
        (statusFilter === 'pending' && item.apartmentStatus === 'PENDING');

      return matchesSearch && matchesStatus;
    });
  }, [data, searchKeyword, statusFilter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => b.id.localeCompare(a.id));
  }, [filteredData]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);

  const paginatedData = useMemo(() => {
    return sortedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [sortedData, currentPage]);

  return {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    filteredData: sortedData,
  };
}
