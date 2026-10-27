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
    showAlertOnNoLogin = false,
  }: RoleGuardOptions = {},
) => {
  const router = useRouter();
  const role = useAuthStore((state) => state.user?.role);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !isInitialized) return;

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
    isInitialized,
    router,
    allowedRoles,
    redirectIfNoLogin,
    redirectIfUnauthorized,
    showAlertOnNoLogin,
  ]);

  const isAllowed = hydrated && isInitialized && role && allowedRoles.includes(role);
  return { isAllowed };
};
