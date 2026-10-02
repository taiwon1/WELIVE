import Input from '@/shared/Input';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface SearchApartmentProps {
  value: string;
  onChange: (value: string) => void;
  apartmentList: string[];
  errorText?: string;
  id?: string;
  placeholder?: string;
}

export default function SearchApartment({
  value,
  onChange,
  apartmentList,
  errorText,
  id = 'apartmentName',
  placeholder = '입주 아파트명을 입력해주세요',
}: SearchApartmentProps) {
  const [filteredList, setFilteredList] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if ((value ?? '').trim() === '') {
      setFilteredList([]);
      setShowDropdown(false);
      return;
    }

    const filtered = apartmentList.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase()),
    );
    setFilteredList(filtered);
    setShowDropdown(filtered.length > 0);
  }, [value, apartmentList]);

  return (
    <div className='relative'>
      <Input
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        errorText={errorText}
        color={errorText ? 'error' : 'secondary'}
        childrenPosition='right'
      >
        <Image src='/icon_search.svg' alt='검색 아이콘' width={24} height={24} />
      </Input>
      {showDropdown && (
        <ul className='absolute z-10 mt-2 w-full rounded-[12px] border border-gray-200 bg-white py-2 text-sm'>
          {filteredList.map((item) => (
            <li
              key={item}
              className='hover:bg-main-15 cursor-pointer px-4 py-2'
              onClick={() => {
                onChange(item);
                setTimeout(() => {
                  setShowDropdown(false);
                }, 0);
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
