import Select from '@/shared/Select';
import Input from '@/shared/Input';
import Image from 'next/image';
import Button from '@/shared/Button';
import Link from 'next/link';

type Option = { value: string; label: string };

type Props = {
  status: string;
  keyword: string;
  onStatusChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
};

type AdminProps = Props & {
  visibility: string;
  dong: string;
  ho: string;
  dongOptions: Option[];
  hoOptions: Option[];
  onVisibilityChange: (value: string) => void;
  onDongChange: (value: string) => void;
  onHoChange: (value: string) => void;
};

export const statusOptions = [
  { value: 'PENDING', label: '접수전' },
  { value: 'IN_PROGRESS', label: '처리중' },
  { value: 'RESOLVED', label: '처리완료' },
  { value: 'REJECTED', label: '처리불가' },
];

const filterStatusOptions = [{ value: '전체', label: '전체' }, ...statusOptions];

export function AdminCivilListFilter({
  status,
  keyword,
  onStatusChange,
  onKeywordChange,
  onSearch,
  visibility,
  dong,
  ho,
  dongOptions,
  hoOptions,
  onVisibilityChange,
  onDongChange,
  onHoChange,
}: AdminProps) {
  return (
    <ul className='flex flex-col gap-[25px]'>
      <li>
        <ul className='flex gap-4'>
          <li>
            <Select label='동' value={dong} onChange={onDongChange} options={[...dongOptions]} />
          </li>
          <li>
            <Select label='호' value={ho} onChange={onHoChange} options={[...hoOptions]} />
          </li>
          <li>
            <Select
              label='공개 여부'
              value={visibility}
              onChange={onVisibilityChange}
              options={[
                { value: '전체', label: '전체' },
                { value: '공개', label: '공개' },
                { value: '비공개', label: '비공개' },
              ]}
            />
          </li>
          <li>
            <Select
              label='처리 상태'
              value={status}
              onChange={onStatusChange}
              options={filterStatusOptions}
            />
          </li>
        </ul>
      </li>
      <li>
        <div className='w-[375px]'>
          <Input
            label='검색'
            childrenPosition='left'
            color='search'
            placeholder='검색어를 입력해 주세요'
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSearch();
            }}
          >
            <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
          </Input>
        </div>
      </li>
    </ul>
  );
}

export function ResidentCivilListFilter({
  status,
  keyword,
  onStatusChange,
  onKeywordChange,
  onSearch,
}: Props) {
  return (
    <ul className='mb-5 flex flex-col gap-[25px]'>
      <li>
        <ul className='flex gap-4'>
          <li>
            <Select
              label='처리 상태'
              value={status}
              onChange={onStatusChange}
              options={filterStatusOptions}
            />
          </li>
        </ul>
      </li>
      <li>
        <div className='flex items-center justify-between'>
          <div className='w-[375px]'>
            <Input
              label='검색'
              color='search'
              placeholder='검색어를 입력해 주세요'
              childrenPosition='left'
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch();
              }}
            >
              <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
            </Input>
          </div>
          <Link href='/resident/civil/create'>
            <Button label='&nbsp;'>민원 등록하기</Button>
          </Link>
        </div>
      </li>
    </ul>
  );
}
