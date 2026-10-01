import { AdminButtonProps } from '../model/adminNotice.types';
import { cn } from '@/shared/lib/helper';
export default function AdminButton({
  title,
  onClick,
  type = 'button',
  disabled = false,
}: AdminButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-[44px] w-full max-w-[120px] rounded-xl border border-gray-300 text-sm',
        'transition-colors duration-150',
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-300'
          : 'active:bg-main hover:border-main hover:text-main cursor-pointer text-gray-400 active:text-white',
      )}
    >
      {title}
    </button>
  );
}
