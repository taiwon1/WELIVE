import { addLayout } from '@/shared/lib/addLayout';
import CivilViewPage from '@/widgets/civil/CivilViewPage';
export default function CivilView() {
  return <CivilViewPage />;
}

CivilView.getLayout = addLayout('resident');
