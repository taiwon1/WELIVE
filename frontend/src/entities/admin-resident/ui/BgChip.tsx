import { cn } from '@/shared/lib/helper';

interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const statusStyleMap: Record<string, { bg: string; text: string }> = {
  공개: { bg: 'bg-blue', text: 'text-white' },
  비공개: { bg: 'bg-blue-15', text: 'text-blue' },
  세대주: { bg: 'bg-blue', text: 'text-white' },
  세대원: { bg: 'bg-blue-15', text: 'text-blue' },
  대기: { bg: 'bg-main', text: 'text-white' },
  승인: { bg: 'bg-main-15', text: 'text-main' },
  가입: { bg: 'bg-main-15', text: 'text-main' },
  미가입: { bg: 'bg-gray-50', text: 'text-gray-300' },
  투표중: { bg: 'bg-main', text: 'text-white' },
  투표전: { bg: 'bg-main-15', text: 'text-main' },
};

export default function BgChip({ children, className, ...props }: ChipProps) {
  const statusKoMap: Record<string, string> = {
    HOUSEHOLDER: '세대주',
    MEMBER: '세대원',
    isRegistered: '가입',
    PENDING: '대기',
    APPROVED: '승인',
    JOINED: '가입',
    PUBLIC: '공개',
    PRIVATE: '비공개',
    VOTING: '투표중',
    BEFORE_VOTE: '투표전',
  };
  let text = typeof children === 'string' ? children : '';
  // 영어면 한글로 변환
  text = statusKoMap[text] ?? text;
  const style = statusStyleMap[text] ?? {
    bg: 'bg-gray-50',
    text: 'text-gray-300',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-1 text-[12px] leading-[14px] font-semibold',
        style.bg,
        style.text,
        className,
      )}
      {...props}
    >
      {text}
    </div>
  );
}
