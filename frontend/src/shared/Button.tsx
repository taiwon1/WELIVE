import { cn } from '@/shared/lib/helper';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary';
  fill?: boolean;
  outline?: boolean;
  label?: string;
}

export default function Button({
  size = 'md',
  color = 'primary',
  fill = false,
  outline = false,
  label,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <div>
      {label && <div className='mb-3 block text-[14px] font-semibold'>{label}</div>}
      <button
        className={cn(
          'cursor-pointer rounded-[12px] whitespace-nowrap transition-all duration-200 ease-in-out hover:shadow-[0px_4px_8px_rgba(0,0,0,0.1)]',
          {
            sm: 'px-3.5 py-3 text-sm leading-[17px] font-medium',
            md: 'px-8.5 py-3.5 text-sm leading-[17px] font-medium',
            lg: 'w-[220px] px-8.5 py-4.5 text-[16px] leading-[19px] font-medium',
          }[size] ?? '',
          {
            primary: outline
              ? 'border-main text-main border bg-white'
              : 'border-main bg-main border text-white',
            secondary: outline
              ? 'border border-gray-400 bg-white text-gray-400'
              : 'border border-gray-400 bg-gray-400 text-white',
          }[color] ?? '',
          fill && 'w-full',
          disabled &&
            'cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-300 hover:shadow-none',
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </div>
  );
}
