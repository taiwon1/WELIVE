import Button from '@/shared/Button';
import { NoticeMainProps } from '../model/notice.types';
import React from 'react';
import Textarea from '@/shared/Textarea';

export default function NoticeMain({
  notice,
  handleNotice,
  handleSubmit,
  isDisabled,
  text,
}: NoticeMainProps) {
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex gap-3.5'>
        <label htmlFor='notice-title' className='mt-3 text-base font-semibold text-black'>
          제목
        </label>
        <input
          id='notice-title'
          className='focus:border-main min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-base focus-visible:outline-2'
          value={notice?.title ?? ''}
          onChange={(e) => handleNotice({ field: 'title', value: e.target.value })}
        />
      </div>

      <div className='flex gap-3.5'>
        <label htmlFor='notice-content' className='mt-3 text-base font-semibold text-black'>
          내용
        </label>
        <Textarea
          id='notice-content'
          className='h-screen max-h-[568px] flex-1'
          value={notice?.content ?? ''}
          onChange={(e) => handleNotice({ field: 'content', value: e.target.value })}
        />
      </div>

      <div className='ml-10 max-w-[480px]'>
        <Button fill={true} disabled={isDisabled} onClick={handleSubmit}>
          <label className='cursor-pointer'>{text}</label>
        </Button>
      </div>
    </div>
  );
}
