import Image from 'next/image';
import { NoticeSelectProps } from '../model/notice.types';
import { useState } from 'react';

export default function NoticeSelect({ label, defaultOption, handleNotice }: NoticeSelectProps) {
  const [selected, setSelected] = useState(defaultOption || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSelected = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setSelected(newValue);
    handleNotice({ field: 'boardName', value: newValue });
  };

  const SELECT_OPTIONS: string[] = [
    '전체',
    '정기점검',
    '긴급점검',
    '공동생활',
    '주민투표',
    '주민회의',
    '기타',
  ];

  return (
    <div className='flex items-center gap-3.5'>
      <label htmlFor='category' className='text-sm font-semibold text-black'>
        {label}
      </label>
      <div className='relative flex'>
        <select
          id='category'
          className={`w-36 appearance-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm ${selected === '' ? 'text-gray-300' : 'text-black'} focus:border-main focus:outline-none`}
          value={selected}
          onChange={handleSelected}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          {!isOpen && defaultOption && (
            <option value={defaultOption} key={defaultOption}>
              {defaultOption}
            </option>
          )}

          {SELECT_OPTIONS.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
        <span className='pointer-events-none absolute top-1/2 right-3 -translate-y-1/2'>
          <Image src='/icon_drop_arrow.svg' alt='드롭다운' width={24} height={24} />
        </span>
      </div>
    </div>
  );
}
