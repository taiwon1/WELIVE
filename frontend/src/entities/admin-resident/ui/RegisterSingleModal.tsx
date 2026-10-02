import AdminButton from './AdminButton';
import AdminSelect from './AdminSelect';
import Modal from '@/shared/Modal';
import { RESIDENCE_OPTIONS } from '../model/constants';
import { ResidentModalProps } from '../model/adminNotice.types';
import { cn } from '@/shared/lib/helper';
import { registerSchema } from '../model/registerSchema';
import { useAuthStore } from '@/shared/store/auth.store';
import { useState } from 'react';

const INPUT_FIELDS = [
  { key: 'building', label: '동', placeholder: '동' },
  { key: 'unitNumber', label: '호', placeholder: '호' },
  { key: 'name', label: '이름', placeholder: '이름을 입력해주세요' },
  { key: 'contact', label: '연락처', placeholder: '연락처를 입력해주세요 (01012341234)' },
] as const;

export default function RegisterSingleModal({
  isModalOpen,
  setIsModalOpen,
  onSubmit,
}: ResidentModalProps) {
  const user = useAuthStore((state) => state.user);
  const initialFormState = {
    apartmentId: user?.apartmentId || '',
    building: '',
    unitNumber: '',
    name: '',
    contact: '',
    residenceStatus: 'RESIDENCE',
    isHouseholder: '',
    approvalStatus: 'PENDING',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    const result = registerSchema.safeParse({ ...formData, [field]: value });
    setFormErrors((prev) => {
      const errors = { ...prev };
      if (result.success) {
        delete errors[field];
      } else {
        const fieldError = result.error.errors.find((err) => err.path[0] === field);
        if (fieldError) errors[field] = fieldError.message;
        else delete errors[field];
      }
      return errors;
    });
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setFormErrors({});
    setTouchedFields({});
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const errors: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setFormErrors(errors);
      setTouchedFields(
        Object.keys(formData).reduce((acc, field) => ({ ...acc, [field]: true }), {}),
      );
      return;
    }

    await onSubmit({
      ...formData,
      building: `${formData.building}동`,
      unitNumber: `${formData.unitNumber}호`,
    });
    handleModalClose();
  };

  const isFormComplete =
    INPUT_FIELDS.every((f) => formData[f.key].trim() !== '') &&
    formData.isHouseholder.trim() !== '';

  const getInputClasses = (field: keyof typeof formData) =>
    cn(
      'h-12 w-full rounded-[12px] px-[16px] text-sm transition-all duration-200 ease-in-out outline-none',
      touchedFields[field] && formErrors[field]
        ? 'border-red border'
        : 'focus:border-main border border-gray-200',
    );

  return (
    <Modal isOpen={isModalOpen} onClose={handleModalClose}>
      <form onSubmit={handleSubmit} className='flex flex-col items-center gap-4 p-6'>
        <h2 className='mb-4 text-xl font-semibold'>개별 등록</h2>
        {INPUT_FIELDS.map(({ key, label, placeholder }) => (
          <div className='w-full' key={key}>
            <label className='mb-3 block text-[14px] font-semibold'>{label}</label>
            <input
              type='text'
              placeholder={placeholder}
              value={formData[key]}
              onChange={(e) => handleChange(key, e.target.value)}
              onBlur={() => handleBlur(key)}
              className={getInputClasses(key)}
            />
            {touchedFields[key] && formErrors[key] && (
              <p className='text-red mt-1 text-sm'>{formErrors[key]}</p>
            )}
          </div>
        ))}

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
          <AdminButton title='닫기' onClick={handleModalClose} type='button' />
          <AdminButton title='등록하기' type='submit' disabled={!isFormComplete} />
        </div>
      </form>
    </Modal>
  );
}
