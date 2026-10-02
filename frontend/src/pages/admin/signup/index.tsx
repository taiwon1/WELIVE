import Button from '@/shared/Button';
import Input from '@/shared/Input';
import Textarea from '@/shared/Textarea';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { adminSignupSchema, AdminSignupForm } from '@/entities/auth/schema/signup.schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { postAdminSignup } from '@/entities/auth/api/signup.api';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { blockLoginUser } from '@/shared/hooks/blockLoginUser';

export const getServerSideProps = blockLoginUser();

export default function AdminSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const router = useRouter();

  const rangeFields = [
    { label: '단지', startId: 'startComplexNumber', endId: 'endComplexNumber' },
    { label: '동', startId: 'startDongNumber', endId: 'endDongNumber' },
    { label: '층', startId: 'startFloorNumber', endId: 'endFloorNumber' },
    { label: '호수', startId: 'startHoNumber', endId: 'endHoNumber' },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<AdminSignupForm>({
    resolver: zodResolver(adminSignupSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: AdminSignupForm) => {
    try {
      await postAdminSignup(data);
      router.replace('/');
    } catch (error) {
      if (isAxiosError(error)) {
        const message =
          error.response?.data?.message ?? error.response?.data?.error ?? '회원가입 실패';
        alert(message);
      } else {
        alert('예상치 못한 오류가 발생했습니다.');
      }
    }
  };

  const LABEL_STYLE = 'block mb-2 text-[14px] text-gray-500';

  return (
    <div className='my-[130px] flex h-screen w-screen flex-col items-center justify-center'>
      <Link href='/'>
        <Image src='/img/logo.svg' alt='로고 이미지' width={174} height={64} />
      </Link>
      <form
        className='mt-[60px] flex flex-col items-center justify-center'
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className='flex w-[1080px] justify-between'>
          {/* 아파트 관리자 정보 */}
          <div className='w-[480px]'>
            <h1 className='text-[20px] font-semibold text-black'>아파트 관리자 정보</h1>
            <div className='mt-10 flex flex-col gap-6'>
              {[
                { id: 'username', label: '아이디', type: 'text' },
                { id: 'password', label: '비밀번호', type: showPassword ? 'text' : 'password' },
                {
                  id: 'passwordConfirm',
                  label: '비밀번호 확인',
                  type: showPasswordConfirm ? 'text' : 'password',
                },
                { id: 'contact', label: '연락처', type: 'text' },
                { id: 'name', label: '이름', type: 'text' },
                { id: 'email', label: '이메일', type: 'text' },
              ].map(({ id, label, type }) => (
                <div key={id}>
                  <label className={LABEL_STYLE} htmlFor={id}>
                    {label}
                  </label>
                  <Input
                    id={id}
                    type={type}
                    placeholder={`${label}를 입력해주세요`}
                    {...register(id as keyof AdminSignupForm)}
                    errorText={errors[id as keyof AdminSignupForm]?.message}
                    color={errors[id as keyof AdminSignupForm] ? 'error' : 'secondary'}
                  >
                    {id === 'password' && (
                      <button
                        type='button'
                        className='cursor-pointer'
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        <Image
                          src={showPassword ? '/img/visibility_on.svg' : '/img/visibility_off.svg'}
                          alt='비밀번호 표시 아이콘'
                          width={24}
                          height={24}
                        />
                      </button>
                    )}
                    {id === 'passwordConfirm' && (
                      <button
                        type='button'
                        className='cursor-pointer'
                        onClick={() => setShowPasswordConfirm((prev) => !prev)}
                      >
                        <Image
                          src={
                            showPasswordConfirm
                              ? '/img/visibility_on.svg'
                              : '/img/visibility_off.svg'
                          }
                          alt='비밀번호 확인 표시 아이콘'
                          width={24}
                          height={24}
                        />
                      </button>
                    )}
                  </Input>
                </div>
              ))}
            </div>
          </div>

          {/* 아파트 정보 */}
          <div className='w-[540px] border-l border-gray-100 pl-[60px]'>
            <h1 className='text-[20px] font-semibold text-black'>아파트 정보</h1>
            <div className='mt-[40px] flex flex-col gap-[24px]'>
              {[
                { id: 'apartmentName', label: '아파트명' },
                { id: 'apartmentAddress', label: '아파트 주소' },
                { id: 'apartmentManagementNumber', label: '관리소 번호' },
              ].map(({ id, label }) => (
                <div key={id}>
                  <label className={LABEL_STYLE} htmlFor={id}>
                    {label}
                  </label>
                  <Input
                    id={id}
                    placeholder={`${label}을 입력해주세요`}
                    {...register(id as keyof AdminSignupForm)}
                    errorText={errors[id as keyof AdminSignupForm]?.message}
                    color={errors[id as keyof AdminSignupForm] ? 'error' : 'secondary'}
                  />
                </div>
              ))}

              <div>
                <label className={LABEL_STYLE} htmlFor='description'>
                  소개
                </label>
                <Textarea
                  id='description'
                  placeholder='아파트 소개를 입력해주세요'
                  {...register('description')}
                  errorText={errors.description?.message}
                  color={errors.description ? 'error' : 'secondary'}
                />
              </div>
              <div className='grid grid-cols-2 gap-x-[62px] gap-y-[52px]'>
                {rangeFields.map(({ label, startId, endId }) => {
                  const startError = errors[startId as keyof AdminSignupForm]?.message;
                  const endError = errors[endId as keyof AdminSignupForm]?.message;
                  const errorMessage = startError || endError;

                  return (
                    <div key={label}>
                      <label className='text-[14px] text-gray-500'>{label}</label>
                      <div className='mt-[8px] flex items-center gap-[10px]'>
                        <div className='w-[90px]'>
                          <Input
                            id={startId}
                            readOnly
                            placeholder={label}
                            className='placeholder:text-right'
                            value={1}
                            {...register(startId as keyof AdminSignupForm)}
                            color={startError ? 'error' : 'secondary'}
                          />
                        </div>
                        <p>~</p>
                        <div className='w-[90px]'>
                          <Input
                            id={endId}
                            placeholder={label}
                            className='placeholder:text-right'
                            {...register(endId as keyof AdminSignupForm)}
                            color={endError ? 'error' : 'secondary'}
                          />
                        </div>
                      </div>
                      {errorMessage && (
                        <p className='text-red mt-[10px] text-[12px]'>{errorMessage}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <Button className='mt-[60px] w-[480px]' disabled={!isValid}>
          시작하기
        </Button>
      </form>
    </div>
  );
}
