import Image from 'next/image';
import Input from '@/shared/Input';
import Select from '@/shared/Select';
import ResidentNoticeTable from '@/entities/notice/ui/ResidentNoticeTable';
import { useState } from 'react';

export default function ResidentNoticePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [tempKeyword, setTempKeyword] = useState('');

  const SELECT_OPTIONS = [
    { value: 'all', label: '전체' },
    { value: 'MAINTENANCE', label: '정기점검' },
    { value: 'EMERGENCY', label: '긴급점검' },
    { value: 'COMMUNITY', label: '공동생활' },
    { value: 'RESIDENT_VOTE', label: '주민투표' },
    { value: 'RESIDENT_COUNCIL', label: '주민회의' },
    { value: 'ETC', label: '기타' },
  ];

  return (
    <>
      <h1 className='mb-10 text-[26px] font-bold'>공지사항</h1>

      <div className='mb-5'>
        <Select
          label='분류'
          options={SELECT_OPTIONS}
          onChange={(value) => setSelectedCategory(value)}
        />
      </div>

      <div className='flex items-end justify-between'>
        <div className='w-[375px]'>
          <Input
            color='search'
            label='검색'
            placeholder='검색어를 입력해 주세요'
            childrenPosition='left'
            value={tempKeyword}
            onChange={(e) => setTempKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setSearchKeyword(tempKeyword);
              }
            }}
          >
            <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
          </Input>
        </div>
      </div>

      {/* 필터 상태 전달 */}
      <ResidentNoticeTable category={selectedCategory} keyword={searchKeyword} />
    </>
  );
}
