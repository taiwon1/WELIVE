import { addLayout } from '@/shared/lib/addLayout';
import ResidentIncidentListPage from '@/widgets/incident/ResidentIncidentListPage';

export default function ResidentIncidentList() {
  return <ResidentIncidentListPage />;
}

ResidentIncidentList.getLayout = addLayout('resident');
