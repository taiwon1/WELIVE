import Image from 'next/image';
import Input from '@/shared/Input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div>
      <label className='mb-3 block text-[14px] font-semibold'>검색</label>
      <Input
        color='search'
        placeholder='검색어를 입력해 주세요'
        childrenPosition='left'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <Image src='/icon_search.svg' alt='검색버튼' width={24} height={24} />
      </Input>
    </div>
  );
}
