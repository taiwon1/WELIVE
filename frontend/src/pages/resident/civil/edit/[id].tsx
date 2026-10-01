import { addLayout } from '@/shared/lib/addLayout';
import CivilEditPage from '@/widgets/civil/CivilEditPage';

export default function CivilEdit() {
  return <CivilEditPage />;
}

CivilEdit.getLayout = addLayout('resident');
