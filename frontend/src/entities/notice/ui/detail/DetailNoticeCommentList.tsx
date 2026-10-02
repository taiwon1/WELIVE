import Button from '@/shared/Button';
import { Comment } from '@/entities/notice/model/notice.types';
import Image from 'next/image';
import Textarea from '@/shared/Textarea';
import { formatDate } from '@/shared/lib/formDate';

interface DetailNoticeCommentListProps {
  comments: Comment[];
  isEditing: boolean;
  editingCommentId: string;
  editComment: string;
  setEditComment: (v: string) => void;
  onEditClick: (id: string, content: string) => void;
  onEditSubmit: (e: React.FormEvent, boardId: string, boardType: string) => void;
  onEditCancel: () => void;
  onDeleteClick: (id: string) => void;
}

export default function DetailNoticeCommentList({
  comments,
  isEditing,
  editingCommentId,
  editComment,
  setEditComment,
  onEditClick,
  onEditSubmit,
  onEditCancel,
  onDeleteClick,
}: DetailNoticeCommentListProps) {
  if (!comments?.length) {
    return <div className='py-10 text-center text-gray-400'>등록된 댓글이 없습니다.</div>;
  }

  return (
    <ul>
      {comments.map((c) => (
        <li key={c.id} className='border-b border-gray-100 py-5'>
          <div className='mb-4 flex items-center gap-4'>
            <div className='text-gray-500'>{c.writerName}</div>
            <div className='text-sm text-gray-300'>{formatDate(c.updatedAt)}</div>
          </div>
          {isEditing && c.id === editingCommentId ? (
            <form
              className='flex gap-4'
              onSubmit={(e) => onEditSubmit(e, c.board.id, c.board.boardType)}
            >
              <Textarea
                className='flex-1'
                placeholder='수정할 댓글을 입력해주세요.'
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
              />
              <Button type='submit' size='sm'>
                저장
              </Button>
              <Button type='button' size='sm' color='secondary' onClick={onEditCancel}>
                취소
              </Button>
            </form>
          ) : (
            <div className='flex justify-between text-gray-500'>
              <div>{c.content}</div>
              <ul className='flex gap-4'>
                <li>
                  <button className='cursor-pointer' onClick={() => onEditClick(c.id, c.content)}>
                    <Image src='/icon_edit.svg' alt='수정하기' width={20} height={20} />
                  </button>
                </li>
                <li>
                  <button className='cursor-pointer' onClick={() => onDeleteClick(c.id)}>
                    <Image src='/icon_remove.svg' alt='삭제하기' width={20} height={20} />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
