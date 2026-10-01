import ResidentNoticePage from '@/widgets/resident-notice/ResidentNoticePage';
import { addLayout } from '@/shared/lib/addLayout';

export default function ResidentNotice() {
  return <ResidentNoticePage />;
}

ResidentNotice.getLayout = addLayout('resident');
