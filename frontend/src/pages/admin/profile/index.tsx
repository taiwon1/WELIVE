import ProfileForm from '@/widgets/profile-edit/ui/ProfileForm';
import { addLayout } from '@/shared/lib/addLayout';

export default function AdminProfile() {
  return <ProfileForm />;
}

AdminProfile.getLayout = addLayout('admin');
