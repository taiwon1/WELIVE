import AdminNoticePage from '@/widgets/admin-notice/AdminNoticePage';
import { addLayout } from '@/shared/lib/addLayout';

export default function AdminNotice() {
  return <AdminNoticePage />;
}

AdminNotice.getLayout = addLayout('admin');
