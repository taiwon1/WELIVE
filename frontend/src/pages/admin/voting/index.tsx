import { ReactNode } from 'react';
import RoleLayout from '@/widgets/RollLayout';
import VotingPage from '@/widgets/voting/VotingPage';

export default function AdminVoting() {
  return <VotingPage />;
}

AdminVoting.getLayout = (page: ReactNode) => {
  return <RoleLayout role='admin'>{page}</RoleLayout>;
};
