import { useEffect, useState } from 'react';

import Image from 'next/image';
import { NoticeCheckProps } from '../model/notice.types';

export default function NoticeCheck({ title, notice, field, handleNotice }: NoticeCheckProps) {
  const [isChecked, setIsChecked] = useState(notice?.isPinned);

  useEffect(() => {
    setIsChecked(notice?.isPinned);
  }, [notice?.isPinned]);

  const handleToggle = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    handleNotice({ field: 'isPinned', value: newValue });
  };

  if (!notice || !field) return null;
  return (
    <div className='flex items-center'>
      <label className='relative flex cursor-pointer items-center text-sm font-semibold select-none'>
        <input
          type='checkbox'
          className='peer sr-only'
          checked={isChecked}
          onChange={handleToggle}
        />
        <div className='peer-checked:bg-main peer-checked:border-main flex h-6 w-6 items-center justify-center rounded-lg border border-gray-200'>
          <Image
            src='/img/check.svg'
            alt='체크'
            width={16}
            height={16}
            className='peer-checked:block'
          />
        </div>
        <span className='ml-2 text-sm font-semibold text-black'>{title}</span>
      </label>
    </div>
  );
}
