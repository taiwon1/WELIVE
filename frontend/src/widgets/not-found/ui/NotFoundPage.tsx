import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function NotFoundPage() {
  const router = useRouter();
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <div className='flex w-[500px] flex-col items-center justify-center'>
        <Image src='img/404.svg' alt='404페이지' width={224} height={136} />
        <h1 className='mt-[68px] text-[18px] font-bold text-gray-500'>찾을 수 없는 페이지입니다</h1>
        <span className='text-4 mt-5 text-[#bdbdbd]'>
          요청하신 페이지가 사라졌거나, 잘못된 경로를 이용하셨어요.
        </span>
        <div className='mt-10 flex w-full justify-between gap-4'>
          <Button onClick={() => router.back()} className='w-[240px]'>
            뒤로 가기
          </Button>
          <Link href='/'>
            <Button className='w-[240px]' outline={true}>
              홈으로 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
