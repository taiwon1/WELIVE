import { AdminNoticeDetailTypes, NoticeDetailProps } from '@/entities/notice/model/notice.types';
import { useEffect, useState } from 'react';

import EditAdminNoticeOptions from '@/entities/notice/ui/edit/EditAdminNoticeOptions';
import NoticeMain from '@/entities/notice/ui/NoticeMain';
import axiosInstance from '@/shared/lib/axios';
import { useAuthStore } from '@/shared/store/auth.store';
import { useRouter } from 'next/router';

export default function EditAdminNoticePage() {
  const [data, setData] = useState<NoticeDetailProps | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { id } = router.query;
  const isCalendarCheck = !!data?.startDate;

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`/notices/${id}`);
        setData(response.data);
      } catch (error) {
        console.error('공지사항 등록 실패:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleEditNotice = ({
    field,
    value,
  }: {
    field: keyof AdminNoticeDetailTypes;
    value: AdminNoticeDetailTypes[keyof AdminNoticeDetailTypes];
  }) => {
    setData((prev) => {
      if (!prev) return null;

      return {
        ...prev,
        [field]: value,
      };
    });
  };

  // newNotice 가공
  const handleEditSubmit = async () => {
    if (!data || !user) return;

    const newNotice = {
      userId: user.id,
      category: data.category,
      title: data.title,
      content: data.content,
      boardId: user.boardIds.NOTICE,
      isPinned: data.isPinned || false,
      startDate: data.startDate,
      endDate: data.endDate,
    };

    try {
      await axiosInstance.patch(`/notices/${id}`, newNotice);
      router.push('/admin/notice');
    } catch (error) {
      console.error('공지사항 수정 실패:', error);
    }
  };

  if (!id) return <p>Loading...</p>;
  if (!data) return <p>공지사항 데이터가 없습니다.</p>;

  return (
    <>
      <h1 className='mb-[54px] text-[26px] font-bold'>공지사항 수정</h1>
      <EditAdminNoticeOptions
        data={data}
        calendarOpen={calendarOpen}
        setCalendarOpen={setCalendarOpen}
        handleEditNotice={handleEditNotice}
        isCalendarCheck={isCalendarCheck}
      />
      <NoticeMain
        notice={data}
        handleNotice={handleEditNotice}
        handleSubmit={handleEditSubmit}
        text='공지사항 수정하기'
      />
    </>
  );
}
