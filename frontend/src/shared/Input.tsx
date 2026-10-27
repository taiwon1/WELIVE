import { cn } from '@/shared/lib/helper';
import { useId } from 'react';

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
  id,
  ...props
}: InputProps) {
  const isError = color === 'error' && !!errorText;
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <>
      {label && (
        <label htmlFor={inputId} className={cn('mb-3 block text-[14px] font-semibold', labelClass)}>
          {label}
        </label>
      )}
      <div className='relative w-full'>
        <input
          id={inputId}
          aria-invalid={isError || undefined}
          aria-describedby={isError ? inputId + '-error' : undefined}
          type={type}
          readOnly={readOnly}
          disabled={disabled}
          className={cn(
            'h-12 w-full rounded-[12px] px-[16px] text-base transition-all duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
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
      {isError && (
        <p id={inputId + '-error'} className='text-red mt-1 text-sm'>
          {errorText}
        </p>
      )}
    </>
  );
}
