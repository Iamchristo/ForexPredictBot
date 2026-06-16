'use client';
import { create } from 'zustand';
import { tokenStorage } from '@/lib/auth';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  exitImpersonation: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAdmin: false,
  isLoading: true,
  isImpersonating: false,

  login: async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token, user } = res.data;
    tokenStorage.setToken(access_token);
    set({ user, token: access_token, isAdmin: user.role === 'admin', isLoading: false, isImpersonating: false });
  },

  register: async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    const { access_token, user } = res.data;
    tokenStorage.setToken(access_token);
    set({ user, token: access_token, isAdmin: user.role === 'admin', isLoading: false });
  },

  logout: () => {
    tokenStorage.removeToken();
    tokenStorage.removeAdminToken();
    tokenStorage.clearImpersonation();
    set({ user: null, token: null, isAdmin: false, isImpersonating: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const res = await authApi.me();
      const user = res.data;
      set({
        user,
        token,
        isAdmin: user.role === 'admin',
        isLoading: false,
        isImpersonating: tokenStorage.isImpersonating(),
      });
    } catch {
      tokenStorage.removeToken();
      set({ user: null, token: null, isAdmin: false, isLoading: false });
    }
  },

  exitImpersonation: () => {
    const adminToken = tokenStorage.getAdminToken();
    if (adminToken) {
      tokenStorage.setToken(adminToken);
      tokenStorage.removeAdminToken();
      tokenStorage.setImpersonating(false);
      set({ isImpersonating: false });
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/users';
      }
    }
  },
}));

export function useAuth() {
  return useAuthStore();
}
