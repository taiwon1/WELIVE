import { useState } from 'react';
import Textarea from '@/shared/Textarea';
import Button from '@/shared/Button';
import { useComments } from '@/shared/comments/hooks/useComments';
import { formatDate } from '@/shared/lib/formDate';
import Image from 'next/image';
import { useAuthStore } from '@/shared/store/auth.store';
import { BoardType, IComment } from '../api/comment.api';

interface CommentProps {
  initialComments: IComment[];
  boardId: string;
  commentCount: number;
  boardType: BoardType;
}

export default function CommentSection({
  initialComments,
  boardId,
  commentCount,
  boardType,
}: CommentProps) {
  const { user } = useAuthStore();
  const currentUserId = user?.id;
  const isAdmin = user?.role === 'ADMIN';

  const [input, setInput] = useState('');
  const [editInput, setEditInput] = useState('');
  const [count, setCount] = useState(commentCount);

  const { comments, editingId, setEditingId, handleCreate, handleUpdate, handleDelete } =
    useComments(initialComments, boardId, boardType);

  const onCreate = async () => {
    if (!input.trim()) return;
    await handleCreate(input.trim());
    setInput('');
    setCount((prev) => prev + 1);
    window.location.reload();
  };

  const onUpdate = async (id: string, content: string) => {
    await handleUpdate(id, content);
    window.location.reload();
  };

  const onDelete = async (id: string) => {
    await handleDelete(id);
    setCount((prev) => prev - 1);
    window.location.reload();
  };

  return (
    <div>
      <div className='mb-[30px] w-full border-b border-gray-500 pb-2 font-medium text-gray-500'>
        댓글 {count}
      </div>

      <form
        className='mb-5 flex gap-4'
        onSubmit={(e) => {
          e.preventDefault();
          onCreate();
        }}
      >
        <Textarea
          className='flex-1'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='댓글을 입력하세요.'
        />
        <Button size='sm' outline type='submit'>
          댓글 등록
        </Button>
      </form>

      <ul>
        {comments.length === 0 ? (
          <div className='py-[120px] text-center text-[14px] text-gray-500'>
            등록된 댓글이 없습니다.
          </div>
        ) : (
          comments.map((comment) => {
            const isOwner = String(comment.userId) === String(currentUserId);
            return (
              <li key={comment.id} className='border-b border-gray-100 py-5'>
                <div className='mb-4 flex items-center gap-4'>
                  <div className='text-gray-500'>{comment.writerName}</div>
                  <div className='text-sm text-gray-300'>{formatDate(comment.updatedAt)}</div>
                </div>

                {editingId === comment.id ? (
                  <form
                    className='flex gap-4'
                    onSubmit={(e) => {
                      e.preventDefault();
                      onUpdate(comment.id, editInput.trim());
                    }}
                  >
                    <Textarea
                      className='flex-1'
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                    />
                    <Button type='submit' size='sm'>
                      저장
                    </Button>
                    <Button
                      type='button'
                      size='sm'
                      color='secondary'
                      onClick={() => setEditingId(null)}
                    >
                      취소
                    </Button>
                  </form>
                ) : (
                  <div className='flex justify-between text-gray-500'>
                    <div>{comment.content}</div>
                    <ul className='flex gap-4'>
                      {isOwner && (
                        <li>
                          <button
                            className='cursor-pointer'
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditInput(comment.content);
                            }}
                          >
                            <Image src='/icon_edit.svg' alt='수정하기' width={20} height={20} />
                          </button>
                        </li>
                      )}
                      {(isOwner || isAdmin) && (
                        <li>
                          <button className='cursor-pointer' onClick={() => onDelete(comment.id)}>
                            <Image src='/icon_remove.svg' alt='삭제하기' width={20} height={20} />
                          </button>
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
