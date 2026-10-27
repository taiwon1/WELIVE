import { useId, useState } from 'react';
import { cn } from '@/shared/lib/helper';

interface Option {
  label: string;
  value: string;
}
interface SelectProps {
  options: Option[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  width?: string;
  className?: string;
  placeholder?: string;
  showPlaceholder?: boolean;
  label?: string;
  small?: boolean;
  defaultValue?: string;
  value?: string;
}

export default function Select({
  options,
  onChange,
  disabled = false,
  width = 'w-[180px]',
  className,
  placeholder = '선택',
  showPlaceholder = false,
  label = '',
  small = false,
  defaultValue,
  value,
}: SelectProps) {
  const id = useId();
  const [selected, setSelected] = useState(
    defaultValue ?? (showPlaceholder ? '' : (options[0]?.value ?? '')),
  );
  const current = value ?? selected;
  return (
    <>
      {label && (
        <label htmlFor={id} className='mb-3 block text-sm font-semibold'>
          {label}
        </label>
      )}
      <select
        id={id}
        aria-label={label || placeholder.trim() || '선택'}
        value={current}
        disabled={disabled}
        onChange={(event) => {
          setSelected(event.target.value);
          onChange?.(event.target.value);
        }}
        className={cn(
          'min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700',
          small ? 'w-[120px]' : width,
          disabled && 'cursor-not-allowed bg-gray-100 text-gray-500',
          className,
        )}
      >
        {showPlaceholder && (
          <option value='' disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </>
  );
}
