import Chip from '@/shared/Chip';
import { getVotingStyle } from '../model/getStatusStyle';

type Props = {
  type: 'approval' | 'process';
  status: 'PENDING' | 'IN_PROGRESS' | 'CLOSED';
};

const statusTextMap: Record<Props['status'], string> = {
  PENDING: '투표전',
  IN_PROGRESS: '투표중',
  CLOSED: '마감',
};

export default function VotingStatusChip({ status }: Props) {
  const style = getVotingStyle(status);
  const label = statusTextMap[status];

  return (
    <Chip bgColor={style.bg} textColor={style.text}>
      {label}
    </Chip>
  );
}
