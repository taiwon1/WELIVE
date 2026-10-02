import ProfileForm from '@/widgets/profile-edit/ui/ProfileForm';
import { addLayout } from '@/shared/lib/addLayout';

export default function ResidentProfile() {
  return <ProfileForm />;
}

ResidentProfile.getLayout = addLayout('resident');
