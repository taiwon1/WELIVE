import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Denied() {
  const router = useRouter();
  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <div className='flex w-[480px] flex-col items-center justify-center'>
        <Link href='/'>
          <Image src='/img/logo.svg' alt='로고' width={202} height={75} />
        </Link>
        <div className='mt-[48px] flex w-full flex-col items-center justify-center gap-[16px] rounded-[12px] border border-gray-200 py-[30px]'>
          <Image src='/img/alert.svg' alt='경고 이미지' width={24} height={24} />
          <span className='text-[16px] text-gray-500'>잘못된 접근입니다.</span>
        </div>
        <Button className='mt-[40px] w-[480px]' onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    </div>
  );
}
