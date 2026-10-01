import { addLayout } from '@/shared/lib/addLayout';
import VotingFormPage from '@/widgets/voting/VotingFormPage';

export default function VotingCreate() {
  return <VotingFormPage />;
}

VotingCreate.getLayout = addLayout('admin');
