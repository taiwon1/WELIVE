import '@/styles/globals.css';

import { AppProps } from 'next/app';
import { NextPage } from 'next';
import { ReactNode } from 'react';

type NextPageWithLayout = NextPage & {
  getLayout: (page: ReactNode) => ReactNode;
};

export default function App({
  Component,
  pageProps,
}: AppProps & { Component: NextPageWithLayout }) {
  const getLayout = Component.getLayout ?? ((page: ReactNode) => page);

  return <>{getLayout(<Component {...pageProps} />)}</>;
}
