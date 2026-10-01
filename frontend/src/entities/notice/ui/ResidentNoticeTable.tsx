import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ResidentNoticeTypes } from '../model/notice.types';
import { fetchResidentNotices } from '../api/noticeApi';
import { cn } from '@/shared/lib/helper';
import Pagination from '@/shared/Pagination';

const CATEGORY_LABEL_MAP = {
  MAINTENANCE: '정기점검',
  EMERGENCY: '긴급점검',
  COMMUNITY: '공동생활',
  RESIDENT_VOTE: '주민투표',
  RESIDENT_COUNCIL: '주민회의',
  ETC: '기타',
} as const;

interface Props {
  category: string;
  keyword: string;
}

export default function ResidentNoticeTable({ category, keyword }: Props) {
  const [notices, setNotices] = useState<ResidentNoticeTypes[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 11;

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const { notices: fetchedNotices } = await fetchResidentNotices(1, 1000);
        setNotices(fetchedNotices);
      } catch (err) {
        console.error('공지사항 불러오기 실패', err);
      }
    };

    loadNotices();
  }, []);

  const filteredNotices = useMemo(() => {
    return notices.filter((notice) => {
      const matchCategory = category === 'all' || notice.category === category;
      const matchKeyword = notice.title.includes(keyword.trim());
      return matchCategory && matchKeyword;
    });
  }, [notices, category, keyword]);

  const sortedNotices = useMemo(() => {
    return [...filteredNotices].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
  }, [filteredNotices]);

  const allNormalNotices = useMemo(
    () => filteredNotices.filter((n) => !n.isPinned),
    [filteredNotices],
  );

  const totalPages = Math.ceil(filteredNotices.length / pageSize);
  const paginatedNotices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedNotices.slice(start, start + pageSize);
  }, [sortedNotices, currentPage]);

  const COLUMNS: { key: keyof ResidentNoticeTypes | 'no'; title: string; width: string }[] = [
    { key: 'no', title: 'NO.', width: '100px' },
    { key: 'category', title: '분류', width: '100px' },
    { key: 'title', title: '제목', width: '' },
    { key: 'writerName', title: '작성자', width: '180px' },
    { key: 'createdAt', title: '등록일시', width: '180px' },
    { key: 'viewsCount', title: '조회수', width: '100px' },
    { key: 'commentsCount', title: '댓글 수', width: '100px' },
  ];

  return (
    <>
      <section className='mt-6 w-full rounded-[12px] border border-gray-200 p-8 text-[14px]'>
        <table className='w-full table-fixed'>
          <colgroup>
            {COLUMNS.map((col, i) => (
              <col style={{ width: col.width }} key={i} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th className='p-3 font-medium' key={col.title}>
                  <div className='line-clamp-1'>{col.title}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedNotices.map((notice) => {
              const globalIndex = allNormalNotices.findIndex((n) => n.noticeId === notice.noticeId);
              const reverseNumber =
                !notice.isPinned && globalIndex >= 0 ? allNormalNotices.length - globalIndex : '';

              return (
                <tr key={notice.noticeId}>
                  {COLUMNS.map((col) => (
                    <td className='p-3 text-center text-gray-500' key={col.key}>
                      <div className='line-clamp-1'>
                        {col.key === 'no' ? (
                          <span className={notice.isPinned ? 'font-semibold text-red-500' : ''}>
                            {notice.isPinned ? '중요' : reverseNumber}
                          </span>
                        ) : col.key === 'title' ? (
                          <div className={cn('text-left', notice.isPinned ? 'text-red-500' : '')}>
                            <Link
                              href={`/resident/notice/detail/${notice.noticeId}`}
                              className='hover:underline'
                            >
                              {notice.title}
                            </Link>
                          </div>
                        ) : col.key === 'category' ? (
                          CATEGORY_LABEL_MAP[notice.category]
                        ) : (
                          notice[col.key]
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
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
    </>
  );
}
