import React, { ReactNode } from 'react';
import Navibar from '@/shared/Navibar';
import Sidebar from '@/shared/Sidebar';
import { useRoleGuard } from '@/shared/hooks/useRoleGuard';
import type { UserRole as AuthRole } from '@/shared/store/auth.store';

type ViewRole = 'resident' | 'admin' | 'superAdmin';

interface RoleLayoutProps {
  children: ReactNode;
  role: ViewRole;
}

const roleMap: Record<ViewRole, AuthRole[]> = {
  resident: ['USER'],
  admin: ['ADMIN'],
  superAdmin: ['SUPER_ADMIN'],
};

export default function RoleLayout({ children, role }: RoleLayoutProps) {
  const allowedRoles = roleMap[role];
  const { isAllowed } = useRoleGuard(allowedRoles);

  if (!isAllowed) return null;

  return (
    <>
      <Navibar />
      <div className='flex min-h-screen items-stretch'>
        <Sidebar role={role} />
        <div className='flex-1 p-[60px]'>{children}</div>
      </div>
    </>
  );
}
