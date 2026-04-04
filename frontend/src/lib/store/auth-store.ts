/* ── Auth Store (Zustand) ── */

import { create } from 'zustand';
import api from '@/lib/api';
import type { User, LoginData, RegisterData, TokenResponse } from '@/lib/types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;

    login: (data: LoginData) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    fetchUser: () => Promise<void>;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: false,
    isAuthenticated: false,

    login: async (data: LoginData) => {
        set({ isLoading: true });
        try {
            const res = await api.post<TokenResponse>('/api/auth/login', data);
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('refresh_token', res.data.refresh_token);
            // Fetch user profile
            const userRes = await api.get<User>('/api/auth/me');
            set({ user: userRes.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    register: async (data: RegisterData) => {
        set({ isLoading: true });
        try {
            const res = await api.post<TokenResponse>('/api/auth/register', data);
            localStorage.setItem('access_token', res.data.access_token);
            localStorage.setItem('refresh_token', res.data.refresh_token);
            const userRes = await api.get<User>('/api/auth/me');
            set({ user: userRes.data, isAuthenticated: true, isLoading: false });
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
    },

    fetchUser: async () => {
        try {
            const res = await api.get<User>('/api/auth/me');
            set({ user: res.data, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
        }
    },

    hydrate: () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            // Attempt to fetch user from token
            api.get<User>('/api/auth/me')
                .then((res) => set({ user: res.data, isAuthenticated: true }))
                .catch(() => set({ user: null, isAuthenticated: false }));
        }
    },
}));
