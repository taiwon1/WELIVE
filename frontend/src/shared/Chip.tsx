import { cn } from '@/shared/lib/helper';

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  bgColor?: string;
  textColor?: string;
}

export default function Chip({
  bgColor = 'bg-gray-50',
  textColor = 'text-gray-300',
  children,
  className,
  ...props
}: ChipProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-[12px] leading-[14px] font-semibold',
        bgColor,
        textColor,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
