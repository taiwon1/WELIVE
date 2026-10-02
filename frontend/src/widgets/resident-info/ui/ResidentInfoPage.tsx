import { useState } from 'react';
import { useResidentInfo } from '@/entities/resident-info/model/useResidentInfo';
import ResidentInfoFilter from './ResidentInfoFilter';
import ResidentInfoTable from './ResidentInfoTable';
import Pagination from '@/shared/Pagination';
import Title from '@/shared/Title';

export default function ResidentInfoPage() {
  const [building, setBuilding] = useState('전체');
  const [unitNumber, setUnitNumber] = useState('전체');
  const [approvalStatus, setApprovalStatus] = useState('전체');
  const [keyword, setKeyword] = useState('');

  const { paginatedData, currentPage, totalPages, setCurrentPage, totalCount } = useResidentInfo({
    building,
    unitNumber,
    approvalStatus,
    keyword,
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  return (
    <div>
      <Title className='mb-10'>입주민 계정 관리</Title>
      <ResidentInfoFilter
        building={building}
        unitNumber={unitNumber}
        approvalStatus={approvalStatus}
        keyword={keyword}
        onBuildingChange={setBuilding}
        onUnitNumberChange={setUnitNumber}
        onApprovalStatusChange={setApprovalStatus}
        onKeywordChange={setKeyword}
        onSearch={handleSearch}
      />
      <ResidentInfoTable
        data={paginatedData}
        totalCount={totalCount}
        currentPage={currentPage}
        itemsPerPage={11}
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
