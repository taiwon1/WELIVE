import { LoginForm, loginSchema } from '@/entities/auth/schema/login.schema';

import Button from '@/shared/Button';
import { GetServerSideProps } from 'next';
import Image from 'next/image';
import Input from '@/shared/Input';
import Link from 'next/link';
import cookie from 'cookie';
import { isAxiosError, AxiosError } from 'axios';
import jwt from 'jsonwebtoken';
import { postLogin } from '@/entities/auth/api/login.api';
import { useAuthStore } from '@/shared/store/auth.store';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const cookies = cookie.parse(context.req.headers.cookie || '');
  const token = cookies['access_token'];

  if (!token) {
    return { props: {} };
  }

  try {
    const decoded = jwt.decode(token) as { role?: string } | null;

    if (decoded?.role) {
      return { props: { role: decoded.role } };
    }

    return { props: {} };
  } catch (error) {
    console.log(error);
    return { props: {} };
  }
};

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const response = await postLogin(data);
      const userData = response.data;

      setUser({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        username: userData.username,
        contact: userData.contact,
        avatar: userData.avatar,
        ...(userData.role === 'USER' && { residentDong: userData.residentDong }),
        isActive: userData.isActive,
        joinStatus: userData.joinStatus,
        apartmentId: userData.apartmentId,
        boardIds: userData.boardIds,
      });

      switch (userData.joinStatus) {
        case 'PENDING':
          router.replace('/waiting');
          return;
        case 'REJECTED':
          router.replace('/rejected');
          return;
        case 'APPROVED':
          switch (userData.role) {
            case 'USER':
              router.replace('/resident/notice');
              break;
            case 'ADMIN':
              router.replace('/admin/notice');
              break;
            case 'SUPER_ADMIN':
              router.replace('/super-admin');
              break;
            default:
              router.replace('/');
          }
          break;
        default:
          alert('회원가입 승인 상태가 유효하지 않습니다.');
          router.replace('/');
      }
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string; error?: string }>;
        alert(
          axiosError.response?.data?.error ?? axiosError.response?.data?.message ?? '로그인 실패',
        );
      } else {
        alert('예상치 못한 오류가 발생했습니다.');
      }
    }
  };

  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex w-[480px] flex-col items-center justify-center'
      >
        <Image src='/img/logo.svg' alt='로고' width={174.55} height={64} />
        <div className='mt-[60px] w-full'>
          <Input
            label='아이디'
            id='username'
            placeholder='아이디를 입력해주세요'
            {...register('username')}
            errorText={errors.username?.message}
            color={errors.username ? 'error' : 'secondary'}
          />
        </div>
        <div className='mt-[24px] w-full'>
          <Input
            label='비밀번호'
            id='password'
            type={showPassword ? 'text' : 'password'}
            placeholder='비밀번호를 입력해주세요'
            {...register('password')}
            errorText={errors.password?.message}
            color={errors.password ? 'error' : 'secondary'}
          >
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
          </Input>
        </div>
        <Button fill className='mt-[40px] w-[480px]' type='submit' disabled={!isValid}>
          로그인하기
        </Button>
        <div className='mt-[40px] flex gap-2 text-[14px]'>
          <span>회원이 아니신가요?</span>
          <Link href='/resident/signup' className='text-main underline'>
            회원가입하기
          </Link>
        </div>
      </form>
    </div>
  );
}
