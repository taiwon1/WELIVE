import CreateAdminNoticePage from '@/widgets/admin-notice/CreateAdminNoticePage';
import { addLayout } from '@/shared/lib/addLayout';

export default function CreateAdminNotice() {
  return <CreateAdminNoticePage />;
}

CreateAdminNotice.getLayout = addLayout('admin');
