import EditAdminNoticePage from '@/widgets/admin-notice/EditAdminNotice';
import { addLayout } from '@/shared/lib/addLayout';

export default function EditAdminNotice() {
  return <EditAdminNoticePage />;
}

EditAdminNotice.getLayout = addLayout('admin');
