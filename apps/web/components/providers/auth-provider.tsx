'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch, setAccessToken, getAccessToken } from '@/lib/api';
import type { AuthResponse, User } from '@/lib/types';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; bio?: string }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await apiFetch<User>('/auth/me');
      setUser(me);
    } catch {
      try {
        const refreshed = await apiFetch<AuthResponse>('/auth/refresh', {
          method: 'POST',
          skipAuth: true,
        });
        setAccessToken(refreshed.accessToken);
        setUser(refreshed.user);
      } catch {
        setAccessToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setIsLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const data = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ email, password, name }),
      });
      setAccessToken(data.accessToken);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout errors
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; bio?: string }) => {
    const updated = await apiFetch<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setUser(updated);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser: fetchMe,
      updateProfile,
    }),
    [user, isLoading, login, register, logout, fetchMe, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
