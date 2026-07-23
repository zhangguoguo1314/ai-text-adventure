import { create } from 'zustand';
import api from '@/lib/api';

interface User {
  id: number;
  nickname: string;
  avatar: string | null;
  level: number;
  role: string;
  phone?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: false,

  login: async (phone, password) => {
    const res: any = await api.post('/auth/login', { phone, password });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },

  register: async (data) => {
    const res: any = await api.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    try {
      const res: any = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true });
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },
}));
