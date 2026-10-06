import { create } from 'zustand';
import { api } from '../services/api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      set({ user: res.data.data.user, isLoading: false });
      return true;
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Login failed. Please check your credentials.',
        isLoading: false,
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    set({ user: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.data, isLoading: false });
    } catch (e) {
      set({ user: null, isLoading: false });
    }
  },
}));
