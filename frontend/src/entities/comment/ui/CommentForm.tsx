import Textarea from '@/shared/Textarea';
import Button from '@/shared/Button';

export default function CommentForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 댓글 등록 처리
  };

  return (
    <form onSubmit={handleSubmit} className='mb-5 flex gap-4'>
      <Textarea className='flex-1' placeholder='댓글을 입력해 주세요' />
      <Button size='sm' outline={true} type='submit'>
        댓글 등록
      </Button>
    </form>
  );
}
