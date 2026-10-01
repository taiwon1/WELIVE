import { useEffect, useState } from 'react';

import { apartmentInfoType } from '../type';
import mockData from '@/entities/apartment-info/api/mockData';

const ITEMS_PER_PAGE = 11;

export function useApartmentInfo() {
  const [data, setData] = useState<apartmentInfoType[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setData(mockData);
  }, []);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const paginatedData = data.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
  };
}
