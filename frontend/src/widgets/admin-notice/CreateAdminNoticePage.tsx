import { AdminNoticeDetailTypes, EditNoticeParam } from '@/entities/notice/model/notice.types';
import { useEffect, useState } from 'react';

import Image from 'next/image';
import NoticeCalendarOpen from '@/entities/notice/ui/NoticeCalendarOpen';
import NoticeCheck from '@/entities/notice/ui/NoticeCheck';
import NoticeMain from '@/entities/notice/ui/NoticeMain';
import { SELECT_OPTIONS } from '@/entities/notice/model/constants';
import Select from '@/shared/Select';
import axiosInstance from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';
import { useRouter } from 'next/router';

export default function CreateAdminNoticePage() {
  const [newNotice, setNewNotice] = useState<Partial<AdminNoticeDetailTypes>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isCalendarCheck = newNotice.startDate;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      setNewNotice((prev) => ({
        ...prev,
        userId: user.id,
        boardId: user.boardIds?.NOTICE,
        isPinned: false,
      }));
    }
  }, [user]);

  const handleCreateNotice = ({ field, value }: EditNoticeParam) => {
    setNewNotice((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const fetchData = async () => {
    try {
      await axiosInstance.post('/notices', newNotice);
    } catch (error) {
      console.error('공지사항 등록 실패:', error);
    }
  };

  const handleCreateSubmit = async () => {
    try {
      await fetchData();
      router.push('/admin/notice');
    } catch (error) {
      console.error('등록 실패:', error);
    }
  };

  const isNoticeValid = (notice: Partial<AdminNoticeDetailTypes>) => {
    return !!notice.category && !!notice.title && !!notice.content;
  };

  const handleDate = () => {
    setCalendarOpen((prev) => !prev);
  };

  return (
    <>
      <h1 className='mb-[54px] text-[26px] font-bold'>공지사항 등록</h1>
      <div className='mb-8 flex gap-10'>
        <div className='flex gap-3.5'>
          <label className='mt-3 text-sm font-semibold text-black'>분류</label>
          <Select
            options={SELECT_OPTIONS}
            showPlaceholder
            placeholder='분류 선택'
            onChange={(value) => handleCreateNotice({ field: 'category', value: value })}
          />
        </div>
        <NoticeCheck
          title={'중요글로 상단에 공지'}
          notice={newNotice}
          field='isPinned'
          handleNotice={handleCreateNotice}
        />

        <div className='flex items-center'>
          <label className='relative flex cursor-pointer items-center text-sm font-semibold select-none'>
            <input
              type='checkbox'
              className='peer sr-only'
              checked={!!newNotice.startDate}
              onChange={() => handleDate()}
            />
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-lg border ${isCalendarCheck ? 'bg-main border-main' : 'border-gray-200 bg-white'} transition-colors`}
            >
              {isCalendarCheck && <Image src='/img/check.svg' alt='체크' width={16} height={16} />}
            </div>
            <div className='ml-2 text-sm font-semibold text-black'>일정으로 등록</div>
          </label>
        </div>

        <NoticeCalendarOpen
          calendarOpen={calendarOpen}
          setCalendarOpen={setCalendarOpen}
          handleNotice={handleCreateNotice}
        />
      </div>

      <NoticeMain
        handleNotice={handleCreateNotice}
        handleSubmit={handleCreateSubmit}
        isDisabled={!isNoticeValid(newNotice)}
        text='공지사항 등록하기'
      />
    </>
  );
}
