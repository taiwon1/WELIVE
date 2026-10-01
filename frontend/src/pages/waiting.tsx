import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '@/shared/store/auth.store';
import { postLogout } from '@/entities/auth/api/logout.api';
import Cookies from 'js-cookie';

export default function ApprovalWaiting() {
  const router = useRouter();
  const resetUser = useAuthStore((state) => state.clearUser);

  const handleLogout = async () => {
    try {
      await postLogout();
    } catch (err) {
      console.error('로그아웃 실패', err);
    } finally {
      resetUser();

      Cookies.remove('access_token', { path: '/', domain: process.env.NEXT_PUBLIC_DOMAIN });
      Cookies.remove('refresh_token', { path: '/', domain: process.env.NEXT_PUBLIC_DOMAIN });
      router.replace('/');
    }
  };

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <div className='flex w-[480px] flex-col items-center justify-center'>
        <Link href='/'>
          <Image src='/img/logo.svg' alt='로고' width={202} height={75} />
        </Link>
        <div className='mt-[48px] flex w-full flex-col items-center justify-center gap-[16px] rounded-[12px] border border-gray-200 py-[30px]'>
          <span className='text-center text-[16px] text-gray-500'>
            계정 승인 대기 중입니다.
            <br />
            승인 후 서비스 이용이 가능합니다.
          </span>
        </div>
        <Button className='mt-[40px] w-[480px]' onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </div>
  );
}
