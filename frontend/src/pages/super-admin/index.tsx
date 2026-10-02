import SuperAdminPage from '@/widgets/super-admin/ui/SuperAdminPage';
import { addLayout } from '@/shared/lib/addLayout';

export default function SuperAdmin() {
  return <SuperAdminPage />;
}

SuperAdmin.getLayout = addLayout('superAdmin');
