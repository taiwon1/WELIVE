import ApartmentInfoPage from '@/widgets/apartment-info/ui/ApartmentInfoPage';
import { addLayout } from '@/shared/lib/addLayout';

export default function ApartmentInfo() {
  return <ApartmentInfoPage />;
}

ApartmentInfo.getLayout = addLayout('admin');
