import Input from '@/shared/Input';
import Button from '@/shared/Button';
import ProfileImageUploader from '@/entities/profile/ui/ProfileImageUploader';
import { useState } from 'react';
import Image from 'next/image';
import Title from '@/shared/Title';
import { useAuthStore } from '@/shared/store/auth.store';
import ProfileReadOnly from './ProfileReadOnly';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '@/entities/profile/schema/profile.schema';
import { patchChangeProfile } from '@/entities/profile/api/profile.api';
import { z } from 'zod';
import { isAxiosError, AxiosError } from 'axios';

export default function ProfileForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const userData = useAuthStore((state) => state.user);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const watchCurrent = watch('currentPassword');
  const watchNew = watch('newPassword');
  const watchConfirm = watch('confirmPassword');

  const isTryingToChangePassword = !!watchCurrent && !!watchNew && !!watchConfirm;

  const isPasswordValid = !errors.currentPassword && !errors.newPassword && !errors.confirmPassword;

  const isButtonEnabled = (isTryingToChangePassword && isPasswordValid) || selectedFile !== null;

  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const { currentPassword, newPassword } = data;

      await patchChangeProfile({
        currentPassword,
        newPassword,
        file: selectedFile ?? undefined,
      });

      alert('프로필이 성공적으로 수정되었습니다. 다시 로그인해주세요.');
      window.location.href = '/';
    } catch (error) {
      console.error(error);

      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<{ error?: string; message?: string }>;
        alert(
          axiosError.response?.data?.error ??
            axiosError.response?.data?.message ??
            '프로필 변경에 실패했습니다.',
        );
      } else {
        alert('예상치 못한 오류가 발생했습니다.');
      }
    }
  };

  return (
    <form className='flex w-[480px] flex-col' onSubmit={handleSubmit(onSubmit)}>
      <Title className='mb-[24px]'>내 프로필</Title>

      <ProfileImageUploader
        onFileChange={setSelectedFile}
        initialImageUrl={userData?.avatar ?? undefined}
      />

      <ProfileReadOnly
        username={userData?.username ?? ''}
        contact={userData?.contact ?? ''}
        name={userData?.name ?? ''}
        email={userData?.email ?? ''}
      />

      {(
        [
          {
            id: 'currentPassword',
            label: '현재 비밀번호',
            show: showCurrentPassword,
            toggle: setShowCurrentPassword,
          },
          { id: 'newPassword', label: '새 비밀번호', show: showPassword, toggle: setShowPassword },
          {
            id: 'confirmPassword',
            label: '새 비밀번호 확인',
            show: showConfirmPassword,
            toggle: setShowConfirmPassword,
          },
        ] as const
      ).map(({ id, label, show, toggle }) => (
        <div className='mb-8' key={id}>
          <label className='mb-2 block text-sm text-gray-500' htmlFor={id}>
            {label}
          </label>
          <Input
            {...register(id)}
            id={id}
            type={show ? 'text' : 'password'}
            errorText={errors[id]?.message}
            color={errors[id] ? 'error' : 'secondary'}
            placeholder={
              id === 'confirmPassword'
                ? '비밀번호를 한번 더 입력해주세요'
                : `${label}를 입력해주세요`
            }
          >
            <button type='button' onClick={() => toggle((prev) => !prev)}>
              <Image
                src={`/img/${show ? 'visibility_on' : 'visibility_off'}.svg`}
                alt='비밀번호 토글'
                width={24}
                height={24}
              />
            </button>
          </Input>
        </div>
      ))}

      <Button
        fill
        className='mt-[28px] h-[54px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-400'
        color='primary'
        type='submit'
        disabled={!isButtonEnabled}
      >
        수정하기
      </Button>
    </form>
  );
}
