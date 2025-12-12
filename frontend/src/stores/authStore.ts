import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseJwt, isTokenExpired } from '@/lib/utils';

interface UserInfo {
  id: number;
  email: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token: string) => {
        const payload = parseJwt(token);
        if (payload) {
          const user: UserInfo = {
            id: parseInt(payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] as string),
            email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] as string,
            name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] as string,
          };
          set({ token, user, isAuthenticated: true });
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false });
      },

      checkAuth: () => {
        const { token } = get();
        if (!token || isTokenExpired(token)) {
          get().logout();
          return false;
        }
        return true;
      },
    }),
    {
      name: 'vr-meta-auth',
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        // После восстановления из localStorage проверяем токен
        if (state?.token) {
          state.setAuth(state.token);
        }
      },
    }
  )
);
