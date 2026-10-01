import { useEffect } from 'react';
import axiosInstance from './lib/axios';
import { AuthUser, useAuthStore } from './store/auth.store';

export default function AuthSession() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    let active = true;

    axiosInstance
      .get<AuthUser>('/users/me')
      .then(({ data }) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) clearUser();
      })
      .finally(() => {
        if (active) setInitialized(true);
      });

    return () => {
      active = false;
    };
  }, [clearUser, setInitialized, setUser]);

  return null;
}
