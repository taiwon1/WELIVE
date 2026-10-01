import Chip from '@/shared/Chip';
import { getVisibilityStyle, getProcessStyle } from '../model/getStatusStyles';

type Props = {
  type: 'visibility' | 'process';
  status: string;
};

export default function StatusChip({ type, status }: Props) {
  const style = type === 'visibility' ? getVisibilityStyle(status) : getProcessStyle(status);

  return (
    <Chip bgColor={style.bg} textColor={style.text}>
      {status}
    </Chip>
  );
}
