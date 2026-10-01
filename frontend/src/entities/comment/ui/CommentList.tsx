import CommentItem from './CommentItem';
import { Comment } from '../type';

interface Props {
  comments: Comment[];
}

export default function CommentList({ comments }: Props) {
  return (
    <ul>
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} />
      ))}
    </ul>
  );
}
