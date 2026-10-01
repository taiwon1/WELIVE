import { useEffect, useState } from 'react';
import Button from '@/shared/Button';
import Input from '@/shared/Input';
import { useApiUrlStore } from '@/shared/store/apiUrl.store';
import Image from 'next/image';
import Link from 'next/link';

export default function SettingPage() {
  const [inputUrl, setInputUrl] = useState('');
  const { url: currentUrl, setUrl, reset } = useApiUrlStore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedUrl = localStorage.getItem('apiBaseUrl');
      setInputUrl(savedUrl || currentUrl);
    }
  }, [currentUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setUrl(inputUrl.trim());
    }
  };

  const handleReset = () => {
    reset();
    const defaultUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:9000/api';
    setInputUrl(defaultUrl);
  };

  return (
    <div className='flex h-screen w-screen flex-col items-center justify-center'>
      <Link href='/'>
        <Image src='/img/logo.svg' alt='로고' width={174.55} height={64} />
      </Link>

      <form className='mt-[60px] flex w-[480px] flex-col' onSubmit={handleSubmit}>
        <label className='text-[20px] font-semibold text-black'>API Base URL 입력</label>
        <Input
          type='text'
          placeholder='서비스에 사용할 API의 base URL을 입력해주세요'
          className='mt-10'
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
        />

        <div className='mt-[60px] flex w-full justify-between'>
          <Button className='w-[230px]' type='submit' disabled={!inputUrl.trim()}>
            설정하기
          </Button>
          <Button className='w-[230px]' type='button' onClick={handleReset}>
            기본값으로 되돌리기
          </Button>
        </div>
      </form>
    </div>
  );
}
