import { useRouter } from 'next/router';
import StatusChip from '@/entities/civil/ui/StatusChip';
import { CivilListType } from '@/entities/civil/type';
import Link from 'next/link';
import Select from '@/shared/Select';
import { statusOptions } from './CivilListFilter';

type Props = {
  data: CivilListType[];
  currentPage: number;
  loading: boolean;
  itemsPerPage: number;
  currentUserId?: string;
  onAdminStatusChange?: (complaintId: string, status: string) => void;
};

export default function CivilListTable({
  data,
  currentPage,
  loading,
  itemsPerPage,
  onAdminStatusChange,
  currentUserId,
}: Props) {
  const tdClass = 'p-3 text-center text-gray-500';
  const thClass = 'p-3 font-medium';

  const { pathname } = useRouter();
  const isAdmin = pathname.includes('/admin');

  const filteredData = data;

  return (
    <>
      <section className='mt-6 w-full overflow-x-auto rounded-[12px] border border-gray-200 p-4 text-[15px]'>
        <table className={'w-full table-fixed ' + (isAdmin ? 'min-w-[900px]' : 'min-w-[1000px]')}>
          <colgroup>
            <col style={{ width: '64px' }} />
            <col />
            <col style={{ width: '180px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '90px' }} />
            {!isAdmin && (
              <>
                <col style={{ width: '80px' }} />
                <col style={{ width: '80px' }} />
              </>
            )}
            <col style={isAdmin ? { width: '160px' } : { width: '100px' }} />
          </colgroup>
          <thead>
            <tr>
              <th className={thClass}>No.</th>
              <th className={thClass}>제목</th>
              <th className={thClass}>작성자</th>
              <th className={thClass}>작성 일시</th>
              <th className={thClass}>공개</th>
              {!isAdmin && (
                <>
                  <th className={thClass}>조회수</th>
                  <th className={thClass}>댓글 수</th>
                </>
              )}
              <th className={thClass}>처리 상태</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 8} className='p-10 text-center text-gray-400'>
                  데이터 로딩 중...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 8} className='p-10 text-center text-gray-400'>
                  아직 작성된 민원이 없습니다.
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => {
                const no = (currentPage - 1) * itemsPerPage + index + 1;
                const isOwn = item.userId === currentUserId;

                return (
                  <tr
                    key={item.complaintId}
                    className={isAdmin && item.status !== 'RESOLVED' ? 'bg-amber-50/60' : ''}
                  >
                    <td className={tdClass}>
                      <div className='line-clamp-1' title={String(no)}>
                        {no}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className='text-left' title={item.title}>
                        {isAdmin && (
                          <span
                            className={
                              'mr-2 mb-1 inline-block rounded px-2 py-1 text-xs font-semibold ' +
                              (!item.adminReadAt
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-gray-100 text-gray-700')
                            }
                          >
                            {item.adminReadAt ? '확인함' : '미확인'}
                          </span>
                        )}
                        <Link
                          href={`/${isAdmin ? 'admin' : 'resident'}/civil/detail/${item.complaintId}`}
                          className={
                            'inline-block min-h-11 content-center hover:underline ' +
                            (isAdmin && !item.adminReadAt ? 'font-semibold text-gray-900' : '')
                          }
                          onClick={(e) => {
                            if (!item.isPublic && !isOwn && !isAdmin) {
                              e.preventDefault();
                              alert('비공개 민원은 작성자만 열람 가능합니다.');
                            }
                          }}
                        >
                          {item.title}
                        </Link>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className='line-clamp-1' title={item.writerName}>
                        {item.dong.replace(/^0+/, '')}동 {item.ho.replace(/^0+/, '')}호{' '}
                        {item.writerName}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className='line-clamp-1' title={item.createdAt}>
                        {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className='line-clamp-1'>
                        <StatusChip type='visibility' status={item.isPublic ? '공개' : '비공개'} />
                      </div>
                    </td>
                    {!isAdmin && (
                      <>
                        <td className={tdClass}>
                          <div className='line-clamp-1' title={String(item.viewsCount)}>
                            {item.viewsCount}
                          </div>
                        </td>
                        <td className={tdClass}>
                          <div className='line-clamp-1' title={String(item.commentsCount)}>
                            {item.commentsCount}
                          </div>
                        </td>
                      </>
                    )}
                    {isAdmin ? (
                      <td className={tdClass}>
                        <div className='text-left'>
                          {item.incidentId ? (
                            <Link
                              href={'/admin/incidents/' + item.incidentId + '#progress'}
                              className='inline-block min-h-11 text-blue-900 underline'
                            >
                              {statusOptions.find((option) => option.value === item.status)?.label}
                              <span className='block text-xs'>공동 문제에서 처리</span>
                            </Link>
                          ) : (
                            <Select
                              options={statusOptions}
                              value={item.status}
                              small={true}
                              onChange={(val) => {
                                onAdminStatusChange?.(item.complaintId, val);
                              }}
                            />
                          )}
                        </div>
                      </td>
                    ) : (
                      <td className={tdClass}>
                        <div className='line-clamp-1'>
                          <StatusChip
                            type='process'
                            status={
                              item.status === 'PENDING'
                                ? '처리 대기'
                                : item.status === 'IN_PROGRESS'
                                  ? '처리중'
                                  : '처리완료'
                            }
                          />
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
