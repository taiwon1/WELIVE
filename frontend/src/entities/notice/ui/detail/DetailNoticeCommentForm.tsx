interface DetailNoticeCommentFormProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function DetailNoticeCommentForm({
  value,
  onChange,
  onSubmit,
}: DetailNoticeCommentFormProps) {
  return (
    <form onSubmit={onSubmit} className='mt-4 flex gap-4'>
      <textarea
        className='focus:border-main min-h-[120px] flex-1 rounded-xl border border-gray-200 p-2 focus:outline-none'
        placeholder='댓글을 입력하세요.'
        value={value}
        onChange={onChange}
        required
        maxLength={300}
      />
      <button
        type='submit'
        className='hover:bg-main text-main border-main max-h-10 cursor-pointer rounded-xl border px-4 py-2 hover:text-white'
      >
        댓글 등록
      </button>
    </form>
  );
}
