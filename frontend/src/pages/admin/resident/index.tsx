import AdminResidentPage from '@/widgets/admin-resident/AdminResidentPage';
import { addLayout } from '@/shared/lib/addLayout';

export default function AdminResident() {
  return (
    <div>
      <AdminResidentPage />
    </div>
  );
}

AdminResident.getLayout = addLayout('admin');
