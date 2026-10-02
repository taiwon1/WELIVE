import Title from '@/shared/Title';
import CivilWriteForm from './CivilWriteForm';

export default function CivilEditPage() {
  return (
    <>
      <Title className='mb-10'>민원 수정하기</Title>
      <CivilWriteForm isEdit />
    </>
  );
}
