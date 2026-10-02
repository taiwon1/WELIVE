import React, { useState } from 'react';

import Image from 'next/image';
import { NoticeCalendarOpenProps } from '../model/notice.types';
import PopupCalendar from '@/entities/calender/ui/PopUpCalendar';

export default function NoticeCalendarOpen({
  calendarOpen,
  setCalendarOpen,
  handleNotice,
}: NoticeCalendarOpenProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const openCalendar = () => setCalendarOpen(true);
  const closeCalendar = () => setCalendarOpen(false);

  const isDatePick = startDate && endDate !== '';

  return (
    <>
      <div className='relative flex w-[420px] items-center gap-4'>
        {/* 시작 시간 */}
        <div className='relative' onClick={openCalendar}>
          <input
            readOnly
            value={startDate}
            type='text'
            placeholder='시작 시간'
            className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-300 ${isDatePick ? 'bg-white text-gray-500' : 'border-none bg-gray-50'} focus:border-main focus:outline-none`}
          />
          <Image
            src='/img/calendar.svg'
            width={24}
            height={24}
            alt='캘린더아이콘'
            className='absolute top-1/2 right-2 -translate-y-1/2'
          />
        </div>

        {/* 구분 기호 */}
        <span className='text-gray-400'>-</span>

        {/* 종료 시간 */}
        <div className='relative'>
          <input
            readOnly
            value={endDate}
            type='text'
            placeholder='종료 시간'
            className={`w-full rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm text-gray-300 ${isDatePick ? 'bg-white text-gray-500' : 'border-none bg-gray-50'} focus:border-main focus:outline-none`}
          />
          <Image
            src='/img/calendar.svg'
            width={24}
            height={24}
            alt='캘린더아이콘'
            className='absolute top-1/2 right-2 -translate-y-1/2'
          />
        </div>

        {calendarOpen && (
          <div className='absolute top-[110%] left-0 mt-4 w-[420px]'>
            <PopupCalendar
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              handleCalenderOpen={closeCalendar}
              handleNotice={handleNotice}
            />
          </div>
        )}
      </div>
    </>
  );
}
