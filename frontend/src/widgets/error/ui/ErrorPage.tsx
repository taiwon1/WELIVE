import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';

interface ErrorPageProps {
  errorMessage: string;
  statusCode?: number;
}

export default function ErrorPage({ errorMessage, statusCode }: ErrorPageProps) {
  return (
    <div className='flex h-screen w-screen items-center justify-center'>
      <div className='flex w-[500px] flex-col items-center justify-center'>
        <Image src='/img/500.svg' alt='500번대 에러 페이지' width={224} height={136} />
        <h1 className='mt-[68px] text-[18px] font-bold text-gray-500'>
          {statusCode ?? 500} 에러가 발생했습니다
        </h1>
        <span className='text-4 mt-5 text-[#bdbdbd]'>{errorMessage}</span>
        <div className='mt-10 flex w-full justify-between gap-4'>
          <Button onClick={() => window.location.reload()} className='h-[55px] w-[240px]'>
            새로 고침
          </Button>
          <Link href='/'>
            <Button className='h-[55px] w-[240px]' outline={true}>
              홈으로 가기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
