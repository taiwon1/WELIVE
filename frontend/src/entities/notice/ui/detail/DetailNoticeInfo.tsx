import Image from 'next/image';
import { NoticeDetailProps } from '@/entities/notice/model/notice.types';
import { translateCategory } from '@/shared/lib/translateCategory';

interface DetailNoticeInfoProps {
  data: NoticeDetailProps | null;
  onEdit: () => void;
  onDelete: () => void;
  commentsCount: number;
}

export default function DetailNoticeInfo({
  data,
  onEdit,
  onDelete,
  commentsCount,
}: DetailNoticeInfoProps) {
  if (!data) return null;
  return (
    <div className='border-b border-gray-200'>
      <div className='mb-5 text-sm text-gray-500'>공지사항</div>
      <h2 className='text-[26px] font-bold'>{data.title}</h2>
      <div className='flex justify-between pt-8 pb-4.5'>
        <ul className='flex gap-4 text-[14px] text-gray-400'>
          <li className='text-main'>{translateCategory(data.category)}</li>
          <li className='text-gray-200'>|</li>
          <li className='text-gray-500'>{data.createdAt}</li>
          <li className='text-gray-200'>|</li>
          <li>조회수 {data.viewsCount}</li>
          <li className='text-gray-200'>|</li>
          <li>댓글수 {commentsCount}</li>
        </ul>
        <ul className='flex gap-4'>
          <li>
            <button className='cursor-pointer' onClick={onEdit}>
              <Image src='/icon_edit.svg' alt='수정하기' width={20} height={20} />
            </button>
          </li>
          <li>
            <button className='cursor-pointer' onClick={onDelete}>
              <Image src='/icon_remove.svg' alt='삭제하기' width={20} height={20} />
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
