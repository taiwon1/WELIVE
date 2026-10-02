import { IoIosArrowBack, IoIosArrowForward } from 'react-icons/io';

interface PaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages?: number;
}

export default function Pagination({
  currentPage,
  setCurrentPage,
  totalPages = 1,
}: PaginationProps) {
  const onPageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className='flex gap-5'>
      {/* 왼쪽 화살표 */}
      <button
        className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 disabled:bg-gray-50 disabled:text-gray-300'
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <IoIosArrowBack className='text-xl' />
      </button>

      {/* 페이지 번호 */}
      <div className='flex gap-2.5'>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 ${
              currentPage === i + 1
                ? 'bg-main border-main text-white'
                : 'hover:text-main hover:border-main text-gray-400'
            }`}
            onClick={() => onPageChange(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* 오른쪽 화살표 */}
      <button
        className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-gray-400 disabled:bg-gray-50 disabled:text-gray-300'
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <IoIosArrowForward className='text-xl font-light' />
      </button>
    </div>
  );
}
