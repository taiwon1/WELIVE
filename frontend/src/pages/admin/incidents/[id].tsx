import { addLayout } from '@/shared/lib/addLayout';
import IncidentDetailPage from '@/widgets/incident/IncidentDetailPage';

export default function AdminIncidentDetail() {
  return <IncidentDetailPage admin />;
}

AdminIncidentDetail.getLayout = addLayout('admin');
