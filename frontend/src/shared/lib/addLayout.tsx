import { ReactNode } from 'react';
import RoleLayout from '@/widgets/RollLayout';

type RoleType = 'admin' | 'superAdmin' | 'resident' | 'none';

export function addLayout(role: RoleType) {
  return function wrapPage(page: ReactNode) {
    if (role === 'none') {
      return page;
    }

    return <RoleLayout role={role}>{page}</RoleLayout>;
  };
}
