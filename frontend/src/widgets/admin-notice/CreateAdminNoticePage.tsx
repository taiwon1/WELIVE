import { CreateAdminNoticeProps, EditNoticeParam } from '@/entities/notice/model/notice.types';
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
import { getIncident } from '@/entities/incident/api/incident.api';

export default function CreateAdminNoticePage() {
  const [newNotice, setNewNotice] = useState<Partial<CreateAdminNoticeProps>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const isCalendarCheck = newNotice.startDate;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const incidentId = typeof router.query.incidentId === 'string' ? router.query.incidentId : null;
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!incidentId) return;
    let active = true;
    setLoadingDraft(true);
    getIncident(incidentId)
      .then((incident) => {
        if (!active) return;
        if (incident.status !== 'RESOLVED') {
          setError('아직 처리 완료된 공동 문제가 아닙니다. 내용을 확인해 직접 작성해주세요.');
          return;
        }
        const latest = incident.updates.find((update) => update.status === 'RESOLVED');
        setNewNotice((previous) => ({
          ...previous,
          category: 'ETC',
          title: '[처리 완료] ' + incident.title,
          content:
            incident.description +
            '\n\n처리 결과\n' +
            (latest?.content ?? '처리가 완료되었습니다.'),
        }));
      })
      .catch(() => {
        if (active)
          setError('공지 초안을 불러오지 못했습니다. 공동 문제로 돌아가 다시 시도해주세요.');
      })
      .finally(() => {
        if (active) setLoadingDraft(false);
      });
    return () => {
      active = false;
    };
  }, [incidentId]);

  useEffect(() => {
    if (user) {
      setNewNotice((prev) => ({
        ...prev,
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

  const handleCreateSubmit = async () => {
    if (posting || loadingDraft || !newNotice.boardId) return;
    setPosting(true);
    setError('');
    try {
      await axiosInstance.post('/notices', newNotice);
      await router.push('/admin/notice');
    } catch (error) {
      console.error('등록 실패:', error);
      setError(
        '공지를 등록하지 못했습니다. 입력한 내용은 유지됩니다. 목록에서 등록 여부를 확인한 뒤 다시 시도해주세요.',
      );
    } finally {
      setPosting(false);
    }
  };

  const isNoticeValid = (notice: Partial<CreateAdminNoticeProps>) => {
    return !!notice.category && !!notice.title?.trim() && !!notice.content?.trim();
  };

  const handleDate = () => {
    setCalendarOpen((prev) => !prev);
  };

  return (
    <>
      <h1 className='mb-[54px] text-[26px] font-bold'>공지사항 등록</h1>
      {incidentId && (
        <p className='mb-6 rounded-xl bg-blue-50 p-4 text-blue-900'>
          공동 문제의 공유 설명과 완료 내역으로 만든 초안입니다. 등록하면 단지 전체 주민에게
          공개됩니다. 개인정보와 공개 범위를 확인하고 수정해주세요.
        </p>
      )}
      {loadingDraft && <p role='status'>공지 초안을 불러오는 중입니다.</p>}
      {error && (
        <p role='alert' className='mb-4 rounded-xl bg-red-50 p-4 text-red-800'>
          {error}
        </p>
      )}
      <div className='mb-8 flex gap-10'>
        <div className='flex gap-3.5'>
          <label className='mt-3 text-sm font-semibold text-black'>분류</label>
          <Select
            options={SELECT_OPTIONS}
            showPlaceholder
            placeholder='분류 선택'
            value={newNotice.category}
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
        notice={newNotice}
        handleNotice={handleCreateNotice}
        handleSubmit={handleCreateSubmit}
        isDisabled={posting || loadingDraft || !newNotice.boardId || !isNoticeValid(newNotice)}
        text={posting ? '등록 중…' : '공지사항 등록하기'}
      />
    </>
  );
}
