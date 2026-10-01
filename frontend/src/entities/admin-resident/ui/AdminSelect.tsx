import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';
import { cn } from '@/shared/lib/helper';

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  width?: string;
  className?: string;
  placeholder?: string;
  label?: string;
}

export default function AdminSelect({
  options,
  value,
  onChange,
  disabled = false,
  width,
  className,
  placeholder = ' ',
  label = '',
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) ?? null;

  const handleSelect = (option: Option) => {
    onChange?.(option.value);
    setOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <>
      {label && <label className='mb-3 block text-[14px] font-semibold'>{label}</label>}
      <div className={cn('relative', width)} ref={wrapperRef}>
        <button
          type='button'
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          className={cn(
            'mt-2 h-[46px] w-full rounded-[12px] border border-gray-200 bg-white px-4 text-left text-sm',
            disabled && 'cursor-not-allowed bg-gray-50 text-gray-300',
            className,
          )}
        >
          {selectedOption ? (
            selectedOption.label
          ) : (
            <span className='text-gray-400'>{placeholder}</span>
          )}
          <span className='pointer-events-none absolute top-1/2 right-4 -translate-y-1/2'>
            <Image src='/icon_drop_arrow.svg' alt='드롭다운' width={24} height={24} />
          </span>
        </button>

        {open && !disabled && (
          <ul className='absolute top-full z-10 mt-1 w-full overflow-y-auto rounded-[12px] border border-gray-200 bg-white'>
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className={cn(
                  'cursor-pointer px-4 py-3 text-sm hover:bg-gray-100',
                  value === option.value && 'font-bold',
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
