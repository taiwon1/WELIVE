import { useRouter } from 'next/router';
import { useCivilList } from '@/entities/civil/model/useCivilList';
import { AdminCivilListFilter, ResidentCivilListFilter, statusOptions } from './CivilListFilter';
import CivilListTable from './CivilListTable';
import Pagination from '@/shared/Pagination';
import Title from '@/shared/Title';
import { useState, useMemo } from 'react';
import axios from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';
import Link from 'next/link';

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
  const [attention, setAttention] = useState<string | undefined>();

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
    error,
    refetch,
  } = useCivilList({
    page,
    limit: ITEMS_PER_PAGE,
    status: statusParam,
    isPublic: isPublicParam,
    dong: dongParam,
    ho: hoParam,
    keyword: keywordParam,
    attention,
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
      refetch();
    } catch (error) {
      console.error('처리 상태 업데이트 실패:', error);
      window.alert('상태 변경에 실패했습니다.');
    }
  };

  return (
    <div>
      <Title className='mb-10'>{role === 'admin' ? '민원 관리' : '민원 남기기'}</Title>
      {role === 'admin' && (
        <div className='mb-6 flex flex-wrap items-center gap-3'>
          {[
            ['', '전체'],
            ['unread', '미확인'],
            ['unfinished', '미처리'],
          ].map(([value, label]) => (
            <button
              key={label}
              type='button'
              aria-pressed={(attention ?? '') === value}
              className={
                'min-h-11 rounded-xl border px-4 ' +
                ((attention ?? '') === value
                  ? 'border-blue-800 bg-blue-50 font-semibold text-blue-900'
                  : 'border-gray-300')
              }
              onClick={() => {
                setAttention(value || undefined);
                setStatus('전체');
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
          <Link
            className='ml-auto min-h-11 content-center font-semibold underline'
            href='/admin/incidents'
          >
            같은 문제의 민원 묶기
          </Link>
          <p className='w-full text-sm text-gray-600'>
            미확인은 관리자가 아직 읽지 않은 민원입니다. 미처리에는 처리 대기와 처리 중인 민원이
            포함됩니다.
          </p>
        </div>
      )}
      {!!error && (
        <p role='alert' className='mb-4 text-red-800'>
          민원을 불러오지 못했습니다.{' '}
          <button className='min-h-11 underline' onClick={refetch}>
            다시 시도
          </button>
        </p>
      )}

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
