import { addLayout } from '@/shared/lib/addLayout';
import IncidentListPage from '@/widgets/incident/IncidentListPage';

export default function AdminIncidentList() {
  return <IncidentListPage />;
}

AdminIncidentList.getLayout = addLayout('admin');
