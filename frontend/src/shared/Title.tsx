import { cn } from '@/shared/lib/helper';

interface TitleProps {
  children: React.ReactNode;
  className?: string;
  category?: string;
}

export default function Title({ children, className, category }: TitleProps) {
  return (
    <>
      {category && <h3 className='mb-5 text-[14px] text-gray-500'>{category}</h3>}
      <h2 className={cn('text-[26px] leading-tight font-bold', className)}>{children}</h2>
    </>
  );
}
