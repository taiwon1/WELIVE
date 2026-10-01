import Chip from '@/shared/Chip';
import { getApprovalStyle, getProcessStyle } from '../model/getStatusStyles';

type Props = {
  type: 'approval' | 'process';
  status: string;
};

const approvalLabelMap: Record<string, string> = {
  APPROVED: '승인',
  REJECTED: '거절',
  PENDING: '대기',
};

const processLabelMap: Record<string, string> = {
  접수전: '접수전',
  처리중: '처리중',
  처리완료: '처리완료',
};

export default function StatusChip({ type, status }: Props) {
  const style = type === 'approval' ? getApprovalStyle(status) : getProcessStyle(status);
  const label =
    type === 'approval'
      ? (approvalLabelMap[status] ?? status)
      : (processLabelMap[status] ?? status);

  return (
    <Chip bgColor={style.bg} textColor={style.text}>
      {label}
    </Chip>
  );
}
