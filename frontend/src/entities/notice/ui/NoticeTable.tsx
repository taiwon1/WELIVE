import { AdminNoticeTypes, AdminTableProps } from '../model/notice.types';

import { AdminNoticeCOLUMNS } from '../model/constants';
import EditDeleteBtn from '@/shared/EditDeleteBtn';
import Link from 'next/link';
import Pagination from '@/shared/Pagination';
import { formatDateToKST } from '@/shared/lib/formatDateToKST';
import { translateCategory } from '@/shared/lib/translateCategory';

export default function NoticeTable({
  data,
  noticeCount,
  currentPage,
  setCurrentPage,
  editClick,
  deleteClick,
}: AdminTableProps) {
  const totalPages = Math.ceil(noticeCount / 11);

  function getSortedData(data: AdminNoticeTypes[]) {
    return [...data].sort((a, b) => {
      if (a.isPinned === b.isPinned) {
        if (!a.createdAt && !b.createdAt) return 0;
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return a.isPinned ? -1 : 1;
    });
  }

  const sortedData = getSortedData(data || []);

  return (
    <div>
      <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
        <table className='w-full'>
          <colgroup>
            {AdminNoticeCOLUMNS.map((col, i) => (
              <col style={{ width: col.width }} key={i} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {AdminNoticeCOLUMNS.map((col) => (
                <th className='p-3 font-medium' key={col.title}>
                  <div className='line-clamp-1'>{col.title}</div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!data || sortedData.length === 0 ? (
              <tr>
                <td colSpan={AdminNoticeCOLUMNS.length} className='p-10 text-center text-gray-400'>
                  공지사항이 없습니다.
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr key={row.noticeId}>
                  {AdminNoticeCOLUMNS.map((col) => (
                    <td className='p-3 text-center text-gray-500' key={col.key.toString()}>
                      <div className='line-clamp-1'>
                        {col.key === 'noticeId' ? (
                          row.isPinned ? (
                            <span style={{ color: '#FC5A50', fontWeight: 700 }}>중요</span>
                          ) : (
                            noticeCount - (currentPage - 1) * 10 - index
                          )
                        ) : col.key === 'title' && 'title' in row ? (
                          row.isPinned ? (
                            <Link href={`/admin/notice/detail/${row.noticeId}`}>
                              <div
                                className='text-left'
                                style={{ color: '#FC5A50', fontWeight: 700 }}
                              >
                                {row[col.key] as string}
                              </div>
                            </Link>
                          ) : (
                            <Link href={`/admin/notice/detail/${row.noticeId}`}>
                              <div className='text-left'>{row[col.key] as string}</div>
                            </Link>
                          )
                        ) : col.key === 'note' ? (
                          <EditDeleteBtn
                            editClick={() => editClick?.(row)}
                            deleteClick={() => deleteClick(row)}
                          />
                        ) : col.key === 'createdAt' ? (
                          <div>{formatDateToKST(row[col.key] as string)}</div>
                        ) : (
                          translateCategory(row[col.key])
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
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
