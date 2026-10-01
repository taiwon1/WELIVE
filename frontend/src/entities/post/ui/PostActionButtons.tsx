import Image from 'next/image';

interface Props {
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function PostActionButtons({ className = '', onEdit, onDelete }: Props) {
  return (
    <ul className={`flex gap-4 ${className}`}>
      {onEdit && (
        <li className='leading-0'>
          <button className='cursor-pointer' onClick={onEdit}>
            <Image src='/icon_edit.svg' alt='수정하기' width='20' height='20' />
          </button>
        </li>
      )}
      {onDelete && (
        <li className='leading-0'>
          <button className='cursor-pointer' onClick={onDelete}>
            <Image src='/icon_remove.svg' alt='삭제하기' width='20' height='20' />
          </button>
        </li>
      )}
    </ul>
  );
}
