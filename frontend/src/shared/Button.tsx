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
          'min-h-11 cursor-pointer rounded-[12px] whitespace-nowrap transition-all duration-200 ease-in-out hover:shadow-[0px_4px_8px_rgba(0,0,0,0.1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800',
          {
            sm: 'px-3.5 py-3 text-sm leading-[17px] font-medium',
            md: 'px-8.5 py-3.5 text-base leading-[20px] font-medium',
            lg: 'w-[220px] px-8.5 py-4.5 text-[16px] leading-[19px] font-medium',
          }[size] ?? '',
          {
            primary: outline
              ? 'border border-green-800 bg-white text-green-800'
              : 'border border-green-800 bg-green-800 text-white',
            secondary: outline
              ? 'border border-gray-400 bg-white text-gray-400'
              : 'border border-gray-400 bg-gray-400 text-white',
          }[color] ?? '',
          fill && 'w-full',
          disabled &&
            'cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-500 hover:shadow-none',
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
