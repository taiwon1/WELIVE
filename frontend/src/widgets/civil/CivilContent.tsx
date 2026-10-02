interface Props {
  content: string;
}

export default function CivilContent({ content }: Props) {
  return (
    <div className='border-t border-gray-100 pt-10 pb-[90px]'>
      <p>{content}</p>
    </div>
  );
}
