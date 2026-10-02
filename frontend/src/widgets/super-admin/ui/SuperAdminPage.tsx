import { useApartmentRequests } from '@/entities/apartmentRequest/model/useApartmentRequests';
import SuperAdminFilter from './SuperAdminFilter';
import SuperAdminTable from './SuperAdminTable';
import Pagination from '@/shared/Pagination';
import Title from '@/shared/Title';

export default function SuperAdminPage() {
  const {
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,
    searchKeyword,
    setSearchKeyword,
    statusFilter,
    setStatusFilter,
    filteredData,
  } = useApartmentRequests();

  return (
    <div>
      <Title className='mb-10'>아파트 관리</Title>
      <SuperAdminFilter
        searchKeyword={searchKeyword}
        setSearchKeyword={setSearchKeyword}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      <SuperAdminTable
        data={paginatedData}
        currentPage={currentPage}
        totalCount={filteredData.length}
      />
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
