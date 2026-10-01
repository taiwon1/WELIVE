import ErrorPage from '@/widgets/error/ui/ErrorPage';
import { useSearchParams } from 'next/navigation';

export default function Custom500() {
  const searchParams = useSearchParams();
  const message = searchParams.get('error') || '서버 내부 오류가 발생했습니다.';

  return <ErrorPage errorMessage={message} statusCode={500} />;
}
