import Chip from '@/shared/Chip';
import { getApprovalStyle } from '../model/getStatusStyles';

type Props = {
  status: string;
};

export default function StatusChip({ status }: Props) {
  const style = getApprovalStyle(status);

  return (
    <Chip bgColor={style.bg} textColor={style.text}>
      {status}
    </Chip>
  );
}
