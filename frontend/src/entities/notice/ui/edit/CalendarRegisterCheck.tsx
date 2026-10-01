import { Dispatch, SetStateAction } from 'react';

import Image from 'next/image';

interface Props {
  calendarOpen: boolean;
  setCalendarOpen: Dispatch<SetStateAction<boolean>>;
  isChecked: boolean;
}

export default function CalendarRegisterCheck({ setCalendarOpen, isChecked }: Props) {
  return (
    <div className='flex items-center'>
      <label className='relative flex cursor-pointer items-center text-sm font-semibold select-none'>
        <input
          type='checkbox'
          className='peer sr-only'
          checked={isChecked}
          onChange={() => setCalendarOpen((prev) => !prev)}
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
        <span className='ml-2 text-sm font-semibold text-black'>일정으로 등록</span>
      </label>
    </div>
  );
}
