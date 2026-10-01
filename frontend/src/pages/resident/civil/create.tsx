import { addLayout } from '@/shared/lib/addLayout';
import CivilWritePage from '@/widgets/civil/CivilWritePage';
export default function CivilWrite() {
  return <CivilWritePage />;
}

CivilWrite.getLayout = addLayout('resident');
