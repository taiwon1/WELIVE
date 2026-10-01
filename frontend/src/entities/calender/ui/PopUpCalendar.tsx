import 'react-calendar/dist/Calendar.css';

import Calendar, { CalendarProps } from 'react-calendar';
import { useEffect, useRef, useState } from 'react';

import Button from '@/shared/Button';
import { PopupCalendarProps } from '../model/calendar.types';
import { customStyle } from '../model/popUpCalendar.styles';

export default function PopupCalendar({
  setStartDate,
  setEndDate,
  handleCalenderOpen,
  handleNotice,
}: PopupCalendarProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:00');

  const calendarRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        handleCalenderOpen();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleCalenderOpen]);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      const newStart = `${dateRange[0].toLocaleDateString('ko-KR')} ${startTime}`;
      const newEnd = `${dateRange[1].toLocaleDateString('ko-KR')} ${endTime}`;
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  }, [dateRange, startTime, endTime, setStartDate, setEndDate]);

  const handleChange: CalendarProps['onChange'] = (value) => {
    if (Array.isArray(value)) {
      setDateRange([value[0], value[1]]);
    } else if (value instanceof Date) {
      setDateRange([value, null]);
    } else {
      setDateRange([null, null]);
    }
  };

  const formatDate = (date: Date, time: string) => {
    const [hour, minute] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(Number(hour));
    newDate.setMinutes(Number(minute));
    return newDate.toISOString().replace('.000', '');
  };

  const handleEditDate = () => {
    if (!dateRange[0] || !dateRange[1]) return;

    const newStart = formatDate(dateRange[0], startTime);
    const newEnd = formatDate(dateRange[1], endTime);

    handleNotice({ field: 'startDate', value: newStart });
    handleNotice({ field: 'endDate', value: newEnd });

    handleCalenderOpen();
  };

  return (
    <div className='rounded-xl border border-gray-200 bg-white p-6' ref={calendarRef}>
      <style>{customStyle}</style>
      <Calendar
        onChange={handleChange}
        value={dateRange}
        selectRange={true}
        locale='en-US'
        prev2Label={null}
        next2Label={null}
        className='customStyle'
      />

      <div>
        <label className='mt-4 mb-1 block text-sm'>시작 시간</label>
        <input
          type='time'
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-400 focus:ring-1 focus:ring-green-300 focus:outline-none'
        />
      </div>

      <div>
        <label className='mt-4 mb-1 block text-sm'>종료 시간</label>
        <input
          type='time'
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className='w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-green-400 focus:ring-1 focus:ring-green-300 focus:outline-none'
        />
      </div>

      <Button fill={true} className='mt-5' onClick={handleEditDate}>
        선택완료
      </Button>
    </div>
  );
}
