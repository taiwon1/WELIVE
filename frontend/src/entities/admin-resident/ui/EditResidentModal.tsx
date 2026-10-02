import { useEffect, useState } from 'react';

import AdminButton from './AdminButton';
import AdminSelect from './AdminSelect';
import { EditResidentModalProps } from '../model/adminNotice.types';
import Input from '@/shared/Input';
import Modal from '@/shared/Modal';
import { RESIDENCE_OPTIONS } from '../model/constants';

export default function EditResidentModal({
  isModalOpen,
  setIsModalOpen,
  onSubmit,
  resident,
}: EditResidentModalProps) {
  const initialFormState = {
    building: '',
    unitNumber: '',
    name: '',
    contact: '',
    isHouseholder: '',
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    if (resident) {
      setFormData({
        building: resident.building ?? '',
        unitNumber: resident.unitNumber ?? '',
        name: resident.name ?? '',
        contact: resident.contact ?? '',
        isHouseholder: resident.isHouseholder ?? '',
      });
    }
  }, [resident, isModalOpen]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error) {
      console.error('개별등록 등록 실패:', error);
      throw error;
    }
  };

  const isFormComplete =
    formData.building.trim() !== '' &&
    formData.unitNumber.trim() !== '' &&
    formData.name.trim() !== '' &&
    formData.contact.trim() !== '' &&
    formData.isHouseholder.trim() !== '';

  return (
    <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
      <form onSubmit={handleSubmit} className='flex flex-col items-center gap-4 p-6'>
        <h2 className='font-semiboldbold text-xl'>명부 수정하기</h2>

        <span className='w-full'>
          <Input
            label='동'
            placeholder='동'
            value={formData.building}
            onChange={(e) => handleChange('building', e.target.value)}
          />
        </span>

        <span className='w-full'>
          <Input
            label='호'
            placeholder='호'
            value={formData.unitNumber}
            onChange={(e) => handleChange('unitNumber', e.target.value)}
          />
        </span>

        <span className='w-full'>
          <Input
            label='이름'
            placeholder='이름을 입력해주세요'
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </span>

        <span className='w-full'>
          <Input
            label='연락처'
            placeholder='연락처를 입력해주세요'
            value={formData.contact}
            onChange={(e) => handleChange('contact', e.target.value)}
          />
        </span>

        <span className='w-full'>
          <AdminSelect
            label='거주'
            options={RESIDENCE_OPTIONS}
            width='full'
            value={formData.isHouseholder}
            onChange={(value) => handleChange('isHouseholder', value)}
          />
        </span>

        <div className='mt-4 flex w-full justify-center gap-3 px-8'>
          <AdminButton title='닫기' onClick={() => setIsModalOpen(false)} type='button' />
          <AdminButton title='등록하기' type='submit' disabled={!isFormComplete} />
        </div>
      </form>
    </Modal>
  );
}
