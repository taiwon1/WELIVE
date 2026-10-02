import { addLayout } from '@/shared/lib/addLayout';
import IncidentDetailPage from '@/widgets/incident/IncidentDetailPage';

export default function ResidentIncidentDetail() {
  return <IncidentDetailPage admin={false} />;
}

ResidentIncidentDetail.getLayout = addLayout('resident');
