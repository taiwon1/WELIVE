import { useApartmentInfo } from '@/entities/apartment-info/model/useApartmentInfo';

import Pagination from '@/shared/Pagination';
import Title from '@/shared/Title';
import ApartmentInfoFilter from './ApartmentInfoFilter';
import ApartmentInfoTable from './ApartmentInfoTable';

export default function ApartmentInfoPage() {
  const { paginatedData, currentPage, totalPages, setCurrentPage } = useApartmentInfo();

  return (
    <div>
      <Title className='mb-10'>아파트 정보 관리</Title>
      <ApartmentInfoFilter />
      <ApartmentInfoTable data={paginatedData} />
      <div className='mt-6 flex justify-center'>
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}
