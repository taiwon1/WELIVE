import { useEffect, useState } from 'react';

import { AdminNoticeTypes } from '@/entities/notice/model/notice.types';
import DeleteModal from '@/shared/DeleteModal';
import Image from 'next/image';
import Input from '@/shared/Input';
import NoticeTable from '@/entities/notice/ui/NoticeTable';
import { SELECT_OPTIONS } from '@/entities/notice/model/constants';
import Select from '@/shared/Select';
import axiosInstance from '@/shared/lib/axios';
import { useRouter } from 'next/router';

const SELECT_OPTIONS_WITH_ALL = [
  { value: '전체', label: '전체' },
  ...SELECT_OPTIONS,
]

export default function AdminNoticePage() {
  const [data, setData] = useState<AdminNoticeTypes[]>([]);
  const [noticeCount, setNoticeCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState(data);
  const [selectOption, setSelectOption] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/notices?page=${currentPage}`);
        setData(response.data.notices);
        setNoticeCount(response.data.totalCount);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [currentPage]);

  // 필터링 data
  useEffect(() => {
    let filtered = data || [];

    if (selectOption && selectOption !== '전체') {
      filtered = filtered.filter((notice) => notice.category === selectOption);
    }

    if (searchKeyword.trim()) {
      filtered = filtered.filter((notice) =>
        notice.title.toLowerCase().includes(searchKeyword.trim().toLowerCase()),
      );
    }

    setFilteredData(filtered);
  }, [selectOption, searchKeyword, data]);

  // 모달 상태 관리
  const [openModal, setOpenModal] = useState<null | 'delete'>(null);
  const handleModalClose = () => setOpenModal(null);

  const handleEditClick = (row: AdminNoticeTypes) => {
    router.push(`/admin/notice/edit/${row.noticeId}`);
  };

  const handleDeleteClick = (row: AdminNoticeTypes) => {
    setSelectedNoticeId(row.noticeId);
    setOpenModal('delete');
  };

  const handleDeleteSubmit = async () => {
    if (!selectedNoticeId) return;
    try {
      await axiosInstance.delete(`/notices/${selectedNoticeId}`);
      setOpenModal(null);
      const response = await axiosInstance.get(`/notices?page=${currentPage}`);
      setData(response.data.notices);
      setNoticeCount(response.data.totalCount);
    } catch (error) {
      console.error('공지사항 삭제 실패:', error);
      alert('공지사항 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <h1 className='mb-10 text-[26px] font-bold'>공지사항</h1>
      <div className='mb-5'>
        <Select
          label='분류'
          options={SELECT_OPTIONS_WITH_ALL}
          onChange={(value) => setSelectOption(value)}
        />
      </div>

      <div className='flex items-end justify-between'>
        <div>
          <label className='mb-3 block text-[14px] font-semibold'>검색</label>
          <Input
            color='search'
            placeholder='검색어를 입력해 주세요'
            childrenPosition='left'
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          >
            <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
          </Input>
        </div>

        <button
          className='bg-main h-[44px] w-full max-w-[120px] cursor-pointer rounded-xl text-sm text-white'
          onClick={() => router.push('/admin/notice/create')}
        >
          공지사항 등록
        </button>
      </div>

      <NoticeTable
        data={filteredData}
        noticeCount={noticeCount}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        editClick={handleEditClick}
        deleteClick={handleDeleteClick}
      />

      {openModal === 'delete' && (
        <DeleteModal
          isModalOpen={true}
          setIsModalOpen={handleModalClose}
          onDelete={handleDeleteSubmit}
        />
      )}
    </>
  );
}
