import { addLayout } from '@/shared/lib/addLayout';
import VotingDetailPage from '@/widgets/voting/VotingDetailPage';

export default function AdminVotingDetail() {
  return <VotingDetailPage />;
}

AdminVotingDetail.getLayout = addLayout('admin');
