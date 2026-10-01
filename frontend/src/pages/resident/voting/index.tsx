import VotingPage from '@/widgets/voting/VotingPage';
import { addLayout } from '@/shared/lib/addLayout';

export default function ResidentVoting() {
  return <VotingPage />;
}

ResidentVoting.getLayout = addLayout('resident');
