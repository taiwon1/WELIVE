import { useRouter } from 'next/router';
import { useCivilList } from '@/entities/civil/model/useCivilList';
import { AdminCivilListFilter, ResidentCivilListFilter, statusOptions } from './CivilListFilter';
import CivilListTable from './CivilListTable';
import Pagination from '@/shared/Pagination';
import Title from '@/shared/Title';
import { useState, useMemo } from 'react';
import axios from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';

const ITEMS_PER_PAGE = 11;

const statusMap: Record<string, string> = Object.fromEntries(
  statusOptions.map((opt) => [opt.value, opt.label]),
);

export default function CivilListPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [tempKeyword, setTempKeyword] = useState('');
  const [visibility, setVisibility] = useState('전체');
  const [dong, setDong] = useState('전체');
  const [ho, setHo] = useState('전체');

  const { pathname } = useRouter();
  const role = pathname.startsWith('/admin') ? 'admin' : 'resident';

  const { user } = useAuthStore();

  const statusParam = status === '전체' ? undefined : status;
  const isPublicParam = visibility === '전체' ? undefined : visibility === '공개' ? true : false;
  const dongParam = dong === '전체' ? undefined : dong;
  const hoParam = ho === '전체' ? undefined : ho;
  const keywordParam = keyword.trim() ? keyword.trim() : undefined;

  const {
    data: { complaints, totalCount },
    loading,
  } = useCivilList({
    page,
    limit: ITEMS_PER_PAGE,
    status: statusParam,
    isPublic: isPublicParam,
    dong: dongParam,
    ho: hoParam,
    keyword: keywordParam,
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const dongOptions = useMemo(() => {
    const dongs = new Set(complaints.map((item) => item.dong));
    return Array.from(dongs).map((dong) => ({ value: dong, label: `${dong}동` }));
  }, [complaints]);

  const hoOptions = useMemo(() => {
    const hos = new Set(complaints.map((item) => item.ho));
    return Array.from(hos).map((ho) => ({ value: ho, label: `${ho}호` }));
  }, [complaints]);

  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      const { data } = await axios.get(`/complaints/${complaintId}`);

      const confirmed = window.confirm(`"${statusMap[newStatus]}" 상태로 변경하시겠습니까?`);
      if (!confirmed) return;

      await axios.patch(`/complaints/${complaintId}/status`, {
        status: newStatus,
      });

      window.alert(
        `상태가 "${statusMap[data.status]}"에서 "${statusMap[newStatus]}"(으)로 변경되었습니다.`,
      );

      setPage(1);
    } catch (error) {
      console.error('처리 상태 업데이트 실패:', error);
      window.alert('상태 변경에 실패했습니다.');
    }
  };

  return (
    <div>
      <Title className='mb-10'>{role === 'admin' ? '민원 관리' : '민원 남기기'}</Title>

      {role === 'admin' ? (
        <AdminCivilListFilter
          status={status}
          keyword={tempKeyword}
          visibility={visibility}
          dong={dong}
          ho={ho}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          onKeywordChange={setTempKeyword}
          onSearch={() => {
            setKeyword(tempKeyword);
            setPage(1);
          }}
          onVisibilityChange={(val) => {
            setVisibility(val);
            setPage(1);
          }}
          onDongChange={(val) => {
            setDong(val);
            setPage(1);
          }}
          onHoChange={(val) => {
            setHo(val);
            setPage(1);
          }}
          dongOptions={[{ value: '전체', label: '전체' }, ...dongOptions]}
          hoOptions={[{ value: '전체', label: '전체' }, ...hoOptions]}
        />
      ) : (
        <ResidentCivilListFilter
          status={status}
          keyword={tempKeyword}
          onStatusChange={(val) => {
            setStatus(val);
            setPage(1);
          }}
          onKeywordChange={setTempKeyword}
          onSearch={() => {
            setKeyword(tempKeyword);
            setPage(1);
          }}
        />
      )}

      <CivilListTable
        data={complaints}
        currentPage={page}
        itemsPerPage={ITEMS_PER_PAGE}
        onAdminStatusChange={handleStatusChange}
        currentUserId={user?.id}
        loading={loading}
      />

      <div className='mt-6 flex justify-center'>
        <Pagination currentPage={page} setCurrentPage={setPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
