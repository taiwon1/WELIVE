import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, UserRole } from '@/shared/store/auth.store';

interface RoleGuardOptions {
  redirectIfNoLogin?: string;
  redirectIfUnauthorized?: string;
  showAlertOnNoLogin?: boolean;
}

export const useRoleGuard = (
  allowedRoles: UserRole[],
  {
    redirectIfNoLogin = '/',
    redirectIfUnauthorized = '/unauthorized',
    showAlertOnNoLogin = true,
  }: RoleGuardOptions = {},
) => {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (!role) {
      if (showAlertOnNoLogin) {
        alert('로그인을 해주세요');
      }
      router.replace(redirectIfNoLogin);
    } else if (!allowedRoles.includes(role)) {
      router.replace(redirectIfUnauthorized);
    }
  }, [
    role,
    hydrated,
    router,
    allowedRoles,
    redirectIfNoLogin,
    redirectIfUnauthorized,
    showAlertOnNoLogin,
  ]);

  const isAllowed = hydrated && role && allowedRoles.includes(role);
  return { isAllowed };
};
