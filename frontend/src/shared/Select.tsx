import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/helper';
import Image from 'next/image';

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
  placeholder = ' ',
  showPlaceholder = false,
  label = '',
  small = false,
  defaultValue,
  value,
}: SelectProps) {
  const [open, setOpen] = useState(false);

  const [selected, setSelected] = useState<Option | null>(
    showPlaceholder ? null : options.find((opt) => opt.value === defaultValue) || options[0],
  );
  const selectedOption = value ? options.find((opt) => opt.value === value) || null : selected;

  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: Option) => {
    setSelected(option);
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
      <div className={cn('relative', small ? 'w-[100px]' : width)} ref={wrapperRef}>
        <button
          type='button'
          onClick={() => !disabled && setOpen((prev) => !prev)}
          disabled={disabled}
          className={cn(
            'w-full rounded-[12px] border border-gray-200 bg-white px-4 text-left text-sm',
            small ? 'h-[36px] w-[100px]' : 'h-[46px]',
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
            <Image
              src='/icon_drop_arrow.svg'
              alt='드롭다운'
              width={small ? 16 : 24}
              height={small ? 16 : 24}
            />
          </span>
        </button>

        {open && !disabled && (
          <ul className='absolute z-10 mt-2 max-h-[200px] w-full overflow-y-auto rounded-[12px] border border-gray-200 bg-white'>
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className={cn(
                  'cursor-pointer px-4 py-3 text-sm hover:bg-gray-100',
                  selected?.value === option.value && 'font-bold',
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
