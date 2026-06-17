"use client";

import { create } from "zustand";

import { authApi } from "@/lib/api";
import { tokenStorage } from "@/lib/auth";
import type { UserInfo } from "@/types";

interface AuthState {
  user: UserInfo | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login(email, password);
      tokenStorage.setToken(data.access_token);
      set({ user: data.user, loading: false, initialized: true });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  register: async (email, name, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(email, name, password);
      tokenStorage.setToken(data.access_token);
      set({ user: data.user, loading: false, initialized: true });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  logout: () => {
    tokenStorage.clearToken();
    set({ user: null, initialized: true });
  },

  fetchMe: async () => {
    const token = tokenStorage.getToken();
    if (!token) {
      set({ initialized: true });
      return;
    }
    try {
      const { data } = await authApi.me();
      set({ user: data, initialized: true });
    } catch {
      tokenStorage.clearToken();
      set({ user: null, initialized: true });
    }
  },
}));
