import { ReactNode } from 'react';

export default function NoLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
