import { NextPageContext } from 'next';
import ErrorPage from '@/widgets/error/ui/ErrorPage';

interface CustomErrorProps {
  errorMessage: string;
  statusCode?: number;
}

export default function CustomError({ errorMessage, statusCode }: CustomErrorProps) {
  return <ErrorPage errorMessage={errorMessage} statusCode={statusCode} />;
}

CustomError.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode || err?.statusCode || 500;
  const errorMessage = err?.message || '알 수 없는 문제가 발생했어요.';

  return { errorMessage, statusCode };
};
