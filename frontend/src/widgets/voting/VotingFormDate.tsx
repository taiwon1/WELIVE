import { useState, useRef, useEffect } from 'react';
import VotingCalendar from '@/entities/voting/ui/VotingCalendar';
import Image from 'next/image';

interface Props {
  startAt?: string;
  endAt?: string;
  setStart: (value: string) => void;
  setEnd: (value: string) => void;
}

export default function VotingFormDate({ startAt, endAt, setStart, setEnd }: Props) {
  const formatISODateToDisplay = (isoString: string) => {
    const date = new Date(isoString);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  };

  const [open, setOpen] = useState(false);
  const [startLabel, setStartLabel] = useState<string>(
    startAt ? formatISODateToDisplay(startAt) : '시작 시간',
  );
  const [endLabel, setEndLabel] = useState<string>(
    endAt ? formatISODateToDisplay(endAt) : '종료 시간',
  );
  const pickerRef = useRef<HTMLDivElement>(null);

  const formatDateTime = (date: Date | null, time: string) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d} ${time}`;
  };

  const handleSelect = (
    range: [Date | null, Date | null],
    times: { startTime: string; endTime: string },
  ) => {
    const [startDate, endDate] = range;
    const formattedStart = formatDateTime(startDate, times.startTime);
    const formattedEnd = formatDateTime(endDate, times.endTime);

    setStartLabel(formattedStart || '시작 시간');
    setEndLabel(formattedEnd || '종료 시간');

    setStart(formattedStart);
    setEnd(formattedEnd);
    setOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div className='flex items-center'>
      <h1 className='mr-[30px] w-[50px] text-[14px] font-semibold'>투표일시</h1>
      <div className='relative w-fit' ref={pickerRef}>
        <div className='flex items-center gap-[15px]'>
          <div
            className={`flex h-[45px] w-[180px] cursor-pointer items-center justify-between rounded-[12px] border px-[20px] text-[14px] ${
              startLabel !== '시작 시간'
                ? 'border-main text-main font-semibold'
                : 'border-gray-200 text-gray-300'
            }`}
            onClick={() => setOpen(true)}
          >
            {startLabel}
            {startLabel === '시작 시간' && (
              <Image src='/img/calendar_gray.svg' alt='캘린더 아이콘' width={20} height={20} />
            )}
          </div>

          <span className='text-black'>-</span>

          <div
            className={`flex h-[45px] w-[180px] cursor-pointer items-center justify-between rounded-[12px] border px-[20px] text-[14px] ${
              endLabel !== '종료 시간'
                ? 'border-main text-main font-semibold'
                : 'border-gray-200 text-gray-300'
            }`}
            onClick={() => setOpen(true)}
          >
            {endLabel}
            {endLabel === '종료 시간' && (
              <Image src='/img/calendar_gray.svg' alt='캘린더 아이콘' width={20} height={20} />
            )}
          </div>
        </div>

        {open && (
          <div className='absolute z-10 mt-2'>
            <VotingCalendar onSelect={handleSelect} />
          </div>
        )}
      </div>
    </div>
  );
}
