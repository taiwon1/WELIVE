import {
  AdminResidentData,
  EditResidentFormData,
  FilterState,
  ResidentFormData,
  ResidentsResponse,
} from '@/entities/admin-resident/model/adminNotice.types';
import {
  getBuildingOptions,
  getIsHouseholderOptions,
  getIsRegisteredOptions,
  getUnitNumberOptions,
} from '@/entities/admin-resident/model/residentOptions';
import { useEffect, useState } from 'react';

import AddFileModal from '@/entities/admin-resident/ui/AddFileModal';
import AdminButton from '@/entities/admin-resident/ui/AdminButton';
import { AdminResidentCOLUMNS } from '@/entities/admin-resident/model/constants';
import DeleteModal from '@/shared/DeleteModal';
import EditResidentModal from '@/entities/admin-resident/ui/EditResidentModal';
import Pagination from '@/shared/Pagination';
import RegisterSingleModal from '@/entities/admin-resident/ui/RegisterSingleModal';
import ResidentTable from '@/entities/admin-resident/ui/ResidentTable';
import SearchBar from '@/entities/admin-resident/ui/SearchBar';
import SelectFilters from '@/entities/admin-resident/ui/SelectFilters';
import axiosInstance from '@/shared/lib/axios';
import { useAdminResidents } from '@/entities/admin-resident/model/useAdminResidents';
import { useModal } from '@/entities/admin-resident/model/useModal';
import { useResidentFilter } from '@/entities/admin-resident/model/useResidentFilter';

export default function AdminResidentPage() {
  const [data, setData] = useState<ResidentsResponse | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    building: 'all',
    unitNumber: 'all',
    isHouseholder: 'all',
    isRegistered: 'all',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedResident, setSelectedResident] = useState<AdminResidentData | undefined>(
    undefined,
  );
  // 입주민 명부
  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/residents');
      setData(response.data);
    } catch (error) {
      console.error('입주민 데이터 패칭 실패:', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const { registerResident, deleteResident, downloadResidentsFile } = useAdminResidents();
  const { openModal, handleModalOpen, handleModalClose } = useModal<
    'addFile' | 'addSingle' | 'edit' | 'delete'
  >();

  const pageSize = 10;
  const { pagedResidents, totalCount } = useResidentFilter(data, filters, currentPage, pageSize);
  const totalPages = Math.ceil(totalCount / pageSize);
  const startingIndex = totalCount - (currentPage - 1) * pageSize;

  const residents: AdminResidentData[] = data?.residents ?? [];

  const isHouseholderLabelMap: Record<string, string> = {
    HOUSEHOLDER: '세대주',
    MEMBER: '세대원',
    NON_HOUSEHOLDER: '비세대주',
  };

  const buildingOptions = getBuildingOptions(residents);
  const unitNumberOptions = getUnitNumberOptions(residents);
  const isHouseholderOptions = getIsHouseholderOptions(residents, isHouseholderLabelMap);
  const isRegisteredOptions = getIsRegisteredOptions(residents);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const handleEditClick = (resident: AdminResidentData) => {
    setSelectedResident(resident);
    handleModalOpen('edit')();
  };

  const handleDeleteClick = (resident: AdminResidentData) => {
    setSelectedResident(resident);
    handleModalOpen('delete')();
  };

  // 입주민 개별 등록
  const handleRegistration = async (formData: ResidentFormData): Promise<void> => {
    try {
      await registerResident(formData);
      await fetchData();
    } catch (error) {
      console.error('등록 실패:', error);
      throw error;
    }
  };

  // 입주민 개별 수정
  const handleEditsubmit = async (formData: EditResidentFormData) => {
    if (!selectedResident) return;
    try {
      await axiosInstance.patch(`/residents/${selectedResident.id}`, formData);
      await fetchData();
      handleModalClose();
    } catch (error) {
      console.error('수정 실패:', error);
    }
  };

  // 입주민 개별 삭제
  const handleDeleteSubmit = async () => {
    if (!selectedResident) return;
    try {
      await deleteResident(selectedResident.id);
      await fetchData();
      handleModalClose();
    } catch (error) {
      console.error('삭제 실패:', error);
    }
  };

  // 양식 다운로드
  const handleClickDownloadForm = () => {
    try {
      const link = document.createElement('a');
      link.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/residents/file/template`;
      link.setAttribute('download', '양식.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('양식 다운로드 중 오류 발생:', error);
    }
  };

  return (
    <>
      <h1 className='mb-10 text-[26px] font-bold'>입주민 명부 관리</h1>
      <SelectFilters
        filters={filters}
        options={{
          building: buildingOptions,
          unitNumber: unitNumberOptions,
          isHouseholder: isHouseholderOptions,
          isRegistered: isRegisteredOptions,
        }}
        onChange={handleFilterChange}
      />

      <div className='mt-5 flex items-end justify-between'>
        <SearchBar value={filters.search} onChange={(v) => handleFilterChange('search', v)} />

        <div className='flex min-w-[568px] gap-8'>
          <AdminButton title='파일등록' onClick={handleModalOpen('addFile')} />
          <AdminButton title='개별등록' onClick={handleModalOpen('addSingle')} />
          <AdminButton title='양식 다운로드' onClick={handleClickDownloadForm} />
          <AdminButton title='명부 다운로드' onClick={downloadResidentsFile} />
        </div>
      </div>

      <ResidentTable
        data={pagedResidents}
        startingIndex={startingIndex}
        COLUMNS={AdminResidentCOLUMNS}
        editClick={handleEditClick}
        deleteClick={handleDeleteClick}
      />

      <div className='mt-6 flex justify-center'>
        <Pagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>

      {openModal === 'addFile' && (
        <AddFileModal
          isModalOpen={true}
          handleModalClose={handleModalClose}
          fetchData={fetchData}
        />
      )}

      {openModal === 'addSingle' && (
        <RegisterSingleModal
          isModalOpen={true}
          setIsModalOpen={handleModalClose}
          onSubmit={handleRegistration}
        />
      )}

      {openModal === 'edit' && (
        <EditResidentModal
          isModalOpen={true}
          setIsModalOpen={handleModalClose}
          onSubmit={handleEditsubmit}
          resident={selectedResident}
        />
      )}

      {openModal === 'delete' && selectedResident && (
        <DeleteModal
          isModalOpen={true}
          setIsModalOpen={handleModalClose}
          onDelete={handleDeleteSubmit}
        />
      )}
    </>
  );
}
