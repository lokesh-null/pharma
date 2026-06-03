import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

export const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,

            // Set auth state after successful OTP verification
            setAuth: (user, accessToken, refreshToken) => {
                localStorage.setItem('access_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('refresh_token', refreshToken);
                }
                set({ user, isAuthenticated: true });
            },

            // Logout action that calls backend then clears state
            logout: async () => {
                try {
                    // Try to notify backend, but don't block if it fails
                    await api.auth.logout().catch(() => {});
                } finally {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    set({ user: null, isAuthenticated: false });
                }
            },

            updateUser: (userData) => set((state) => ({
                user: { ...state.user, ...userData }
            }))
        }),
        {
            name: 'auth-storage',
            // Don't persist tokens in Zustand, we rely on localStorage directly for api.js
            partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
        }
    )
);
