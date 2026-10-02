import { addLayout } from '@/shared/lib/addLayout';
import ResidentInfoPage from '@/widgets/resident-info/ui/ResidentInfoPage';

export default function ResidentInfo() {
  return <ResidentInfoPage />;
}

ResidentInfo.getLayout = addLayout('admin');
