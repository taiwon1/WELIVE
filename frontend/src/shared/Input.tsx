import { cn } from '@/shared/lib/helper';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  color?: 'primary' | 'secondary' | 'error' | 'search';
  errorText?: string;
  children?: React.ReactNode;
  label?: string;
  childrenPosition?: 'left' | 'right';
  labelClass?: string;
}

export default function Input({
  type = 'text',
  color = 'secondary',
  readOnly = false,
  errorText,
  children,
  label,
  childrenPosition = 'right',
  className,
  disabled,
  labelClass,
  ...props
}: InputProps) {
  const isError = color === 'error' && !!errorText;

  return (
    <>
      {label && (
        <label className={cn('mb-3 block text-[14px] font-semibold', labelClass)}>{label}</label>
      )}
      <div className='relative w-full'>
        <input
          type={type}
          readOnly={readOnly}
          disabled={disabled}
          className={cn(
            'h-12 w-full rounded-[12px] px-[16px] text-sm transition-all duration-200 ease-in-out outline-none',
            children ? 'pr-14' : '',
            label,
            children && childrenPosition === 'right' && 'pr-14',
            children && childrenPosition === 'left' && 'pl-14',
            color === 'primary' && 'border-main focus:border-main border',
            color === 'secondary' && 'focus:border-main border border-gray-200',
            color === 'search' && 'border border-gray-50 bg-gray-50',
            color === 'error' && 'border-red border',
            disabled &&
              'cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-300 focus:border-gray-200',
            readOnly && 'border border-gray-200 bg-gray-50 text-gray-300 focus:border-gray-200',
            className,
          )}
          {...props}
        />
        {children && (
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 leading-0',
              childrenPosition === 'right' ? 'right-5' : 'left-5',
            )}
          >
            {children}
          </div>
        )}
      </div>
      {isError && <p className='text-red mt-1 text-sm'>{errorText}</p>}
    </>
  );
}
