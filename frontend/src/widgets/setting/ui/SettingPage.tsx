import { useEffect, useState } from 'react';
import Button from '@/shared/Button';
import Image from 'next/image';
import Link from 'next/link';
import axios from '@/shared/lib/axios';

export default function SettingPage() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

  useEffect(() => {
    axios
      .get('/ping')
      .then(() => setStatus('connected'))
      .catch(() => setStatus('failed'));
  }, []);

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <Link href='/'>
        <Image src='/img/logo.svg' alt='로고' width={174.55} height={64} />
      </Link>

      <div className='mt-[60px] flex w-[480px] flex-col items-center gap-8'>
        <p className='text-[20px] font-semibold text-black'>서비스 연결 상태</p>
        <p className={status === 'connected' ? 'text-green-600' : 'text-gray-500'}>
          {status === 'checking' && '연결을 확인하고 있습니다.'}
          {status === 'connected' && '서비스에 정상적으로 연결되었습니다.'}
          {status === 'failed' && '서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'}
        </p>
        <Link href='/'>
          <Button className='w-[230px]'>돌아가기</Button>
        </Link>
      </div>
    </div>
  );
}
