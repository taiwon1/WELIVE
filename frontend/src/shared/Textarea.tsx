import { cn } from '@/shared/lib/helper';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  color?: 'primary' | 'secondary' | 'error';
  label?: string;
  errorText?: string;
  labelClass?: string;
}

export default function Textarea({
  color = 'secondary',
  readOnly = false,
  disabled = false,
  label,
  className,
  errorText,
  labelClass,
  ...props
}: TextareaProps) {
  const isError = color === 'error' && !!errorText;
  return (
    <>
      {label && (
        <label className={cn('mb-3 block text-[14px] font-semibold', labelClass)}>{label}</label>
      )}
      <textarea
        readOnly={readOnly}
        disabled={disabled}
        className={cn(
          'custom-scrollbar',
          'h-[120px] w-full resize-none rounded-[12px] px-4 py-3 text-sm transition-all duration-200 ease-in-out outline-none',
          color === 'primary' && 'border-main focus:border-main border',
          color === 'secondary' && 'focus:border-main border border-gray-200',
          color === 'error' && 'border-red border',
          disabled &&
            'cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-300 focus:border-gray-200',
          readOnly && 'border border-gray-200 bg-gray-50 text-gray-300 focus:border-gray-200',
          className,
        )}
        {...props}
      />
      {isError && <p className='text-red mt-1 text-sm'>{errorText}</p>}
    </>
  );
}
