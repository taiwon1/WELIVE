import CivilListPage from '@/widgets/civil/CivilListPage';
import { addLayout } from '@/shared/lib/addLayout';

export default function CivilList() {
  return <CivilListPage />;
}

CivilList.getLayout = addLayout('resident');
