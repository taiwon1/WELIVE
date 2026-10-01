import { addLayout } from '@/shared/lib/addLayout';
import VotingDetailPage from '@/widgets/voting/VotingDetailPage';

export default function ResidentVotingDetail() {
  return <VotingDetailPage />;
}

ResidentVotingDetail.getLayout = addLayout('resident');
