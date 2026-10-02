import DetailResidentNoticePage from '@/widgets/resident-notice/DetailResidentNoticePage';
import { addLayout } from '@/shared/lib/addLayout';

export default function DetailAdminNotice() {
  return (
    <div>
      <DetailResidentNoticePage />
    </div>
  );
}

DetailAdminNotice.getLayout = addLayout('resident');
