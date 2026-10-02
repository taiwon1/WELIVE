import PostActionButtons from '@/entities/post/ui/PostActionButtons';
import { Comment } from '../type';

interface Props {
  comment: Comment;
}

export default function CommentItem({ comment }: Props) {
  return (
    <li className='mb-5 border-b border-gray-100 pb-5'>
      <div className='mb-4 flex gap-4'>
        <p className='font-medium text-gray-500'>{comment.author}</p>
        <p className='text-gray-300'>{comment.date}</p>
      </div>
      <div className='flex items-end'>
        <p className='text-gray-500'>{comment.content}</p>
        <PostActionButtons
          className='ml-auto'
          onEdit={() => alert('댓글 수정')}
          onDelete={() => alert('댓글 삭제')}
        />
      </div>
    </li>
  );
}
