import 'react-calendar/dist/Calendar.css';
import Calendar, { CalendarProps } from 'react-calendar';
import { useState } from 'react';
import { customStyle } from '../model/VotingCalendar.styles';
import Button from '@/shared/Button';

interface VotingCalendarProps {
  onSelect: (
    range: [Date | null, Date | null],
    times: { startTime: string; endTime: string },
  ) => void;
}

export default function VotingCalendar({ onSelect }: VotingCalendarProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startTime, setStartTime] = useState('12:00');
  const [endTime, setEndTime] = useState('12:00');

  const handleChange: CalendarProps['onChange'] = (value) => {
    if (Array.isArray(value)) {
      setDateRange([value[0], value[1]]);
    } else {
      setDateRange([value, null]);
    }
  };

  const handleConfirm = () => {
    onSelect(dateRange, { startTime, endTime });
  };

  return (
    <div className='rounded-xl border border-gray-200 bg-white px-[24px] pt-[16px] pb-[32px]'>
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

      <div className='mt-4'>
        <label className='mb-2 block text-[14px]'>시작 시간</label>
        <input
          type='time'
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className='h-[44px] w-full rounded-[12px] border border-gray-200 px-[16px] text-center text-[14px] text-gray-500'
        />
      </div>

      <div className='mt-4'>
        <label className='mb-2 block text-[14px]'>종료 시간</label>
        <input
          type='time'
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className='h-[44px] w-full rounded-[12px] border border-gray-200 px-[16px] text-center text-[14px] text-gray-500'
        />
      </div>

      <Button fill={true} onClick={handleConfirm} className='mt-5'>
        선택완료
      </Button>
    </div>
  );
}
