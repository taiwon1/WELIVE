import DetailAdminNoticePage from '@/widgets/admin-notice/DetailAdminNoticePage';
import { addLayout } from '@/shared/lib/addLayout';

export default function DetailAdminNotice() {
  return (
    <div>
      <DetailAdminNoticePage />
    </div>
  );
}

DetailAdminNotice.getLayout = addLayout('admin');
