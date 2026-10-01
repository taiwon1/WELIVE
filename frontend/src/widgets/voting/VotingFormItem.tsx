import { useFieldArray, useFormContext } from 'react-hook-form';
import Checkbox from '@/shared/Checkbox';
import Input from '@/shared/Input';
import Image from 'next/image';
import { VotingFormType } from '@/entities/voting/schema/voting.schema';

export default function VotingFormItem() {
  const {
    control,
    register,
    trigger,
    watch,
    formState: { errors },
  } = useFormContext<VotingFormType>();

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'options',
  });

  const watchOptions = watch('options');

  const handleToggle = (index: number) => {
    const current = watchOptions?.[index];
    update(index, { ...current, enabled: !current?.enabled });
  };

  const handleAdd = () => {
    if (fields.length >= 5) return;
    append({ value: '', enabled: true });
  };

  return (
    <div className='flex'>
      <h1 className='mr-[20px] w-[60px] py-[14px] text-[14px] font-semibold'>투표항목</h1>
      <div className='flex w-full flex-col gap-3'>
        {fields.map((field, index) => {
          const isEnabled = watchOptions?.[index]?.enabled ?? true;
          const errorMessage = errors.options?.[index]?.value?.message as string | undefined;

          return (
            <div key={field.id} className='flex items-center'>
              <Checkbox
                id={`option-${field.id}`}
                checked={isEnabled}
                onChange={() => handleToggle(index)}
                className='mr-[15px]'
              />
              <span className='mr-[25px] w-[50px] text-[14px] font-semibold text-black'>
                항목 {index + 1}
              </span>
              <div className='mr-[25px] w-[540px]'>
                <Input
                  placeholder='내용을 입력해 주세요'
                  disabled={!isEnabled}
                  className='h-[45px]'
                  {...register(`options.${index}.value`, {
                    onBlur: () => {
                      trigger(`options.${index}.value`);
                    },
                  })}
                  errorText={errorMessage}
                  color={errorMessage ? 'error' : 'secondary'}
                />
              </div>
              <button type='button' onClick={() => remove(index)} className='cursor-pointer'>
                <Image src='/img/delete.svg' alt='삭제 아이콘' width={20} height={20} />
              </button>
            </div>
          );
        })}

        {fields.length < 5 && (
          <div className='flex items-center'>
            <Checkbox id='add-option' checked={false} onChange={handleAdd} className='mr-[15px]' />
            <span className='mr-[25px] w-[50px] text-[14px] font-semibold text-black'>추가</span>
            <div className='w-[540px]'>
              <Input
                value=''
                disabled
                placeholder='내용을 입력해 주세요'
                className='h-[45px] bg-gray-100 text-gray-300'
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
