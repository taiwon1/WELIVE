import { cn } from './lib/helper';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
}

export default function Checkbox({
  id,
  checked,
  onChange,
  disabled = false,
  className = '',
}: CheckboxProps) {
  return (
    <label htmlFor={id} className='inline-block cursor-pointer'>
      <input
        id={id}
        type='checkbox'
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className='peer hidden'
      />
      <div
        className={cn(
          'peer-checked:bg-main peer-checked:border-main flex h-[24px] w-[24px] items-center justify-center rounded-[8px] border border-gray-200 transition-colors',
          className,
        )}
      >
        {checked && (
          <svg
            className='h-5 w-5 text-white'
            fill='none'
            stroke='currentColor'
            strokeWidth={2}
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
          </svg>
        )}
      </div>
    </label>
  );
}
