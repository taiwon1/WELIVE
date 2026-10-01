import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  username: string;
  contact: string;
  avatar: string;
  residentDong?: string;
  isActive: boolean;
  joinStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NEED_UPDATE';
  apartmentId: string;
  boardIds: {
    COMPLAINT: string;
    NOTICE: string;
    POLL: string;
  };
}

interface AuthState {
  user: AuthUser | null;
  isInitialized: boolean;
  setUser: (user: AuthUser) => void;
  clearUser: () => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isInitialized: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      setInitialized: (val) => set({ isInitialized: val }),
    }),
    {
      name: 'auth-storage', // localStorage key
    },
  ),
);
