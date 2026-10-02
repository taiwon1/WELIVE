import Image from 'next/image';

interface EditDeleteBtnProps {
  editClick: () => void;
  deleteClick: () => void;
}

export default function EditDeleteBtn({ editClick, deleteClick }: EditDeleteBtnProps) {
  return (
    <ul className='flex justify-center gap-4'>
      <li className='leading-0'>
        <button className='cursor-pointer' onClick={editClick}>
          <Image src='/icon_edit.svg' alt='수정하기' width='20' height='20' />
        </button>
      </li>
      <li className='leading-0'>
        <button className='cursor-pointer' onClick={deleteClick}>
          <Image src='/icon_remove.svg' alt='삭제하기' width='20' height='20' />
        </button>
      </li>
    </ul>
  );
}
