import { Dispatch, SetStateAction, useState } from 'react';

import AdminButton from '../entities/admin-resident/ui/AdminButton';
import Modal from '@/shared/Modal';

interface EditCommentModalProps {
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  initialComment: string;
  onSubmit: (newComment: string) => void;
}

export default function EditCommentModal({
  isModalOpen,
  setIsModalOpen,
  initialComment,
  onSubmit,
}: EditCommentModalProps) {
  const [newComment, setNewComment] = useState(initialComment || '');

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <div className='flex flex-col items-center gap-6 px-20 py-6'>
        <h2 className='text-xl font-semibold'>댓글 수정</h2>
        <textarea
          className='min-h-[100px] w-full rounded border border-gray-300 px-3 py-2 text-sm'
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder='댓글을 입력하세요'
        />
        <div className='flex w-full justify-center gap-3 px-8'>
          <AdminButton title='닫기' onClick={() => setIsModalOpen(false)} />
          <AdminButton title='수정하기' type='submit' onClick={() => onSubmit(newComment)} />
        </div>
      </div>
    </Modal>
  );
}
