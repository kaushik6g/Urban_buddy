import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi, userApi } from '../api/services';
import { storage } from '../utils/storage';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'user' | 'admin',
    dateOfBirth: string,
    communityName?: string,
    communityCode?: string
  ) => Promise<User>;
  updateName: (name: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let active = true;
    const saved = storage.getToken();
    if (!saved || window.location.pathname.replace(/\/$/, '') === '/login') {
      storage.clearAll();
      setRestoring(false);
      return;
    }
    userApi.profile().then(({ data }) => {
      const profile = data.data.user;
      if (!profile?.id || !['user', 'admin'].includes(profile.role)) throw new Error('Invalid session');
      if (active && storage.getToken() === saved) {
        setUser(profile);
        setToken(saved);
      }
    }).catch(() => {
      if (active && storage.getToken() === saved) storage.clearAll();
    }).finally(() => { if (active) setRestoring(false); });
    return () => { active = false; };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      storage.setToken(response.data.token);
      storage.setUser(response.data.user);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data.user as User;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'user' | 'admin',
    dateOfBirth: string,
    communityName?: string,
    communityCode?: string
  ) => {
    setLoading(true);
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role,
        dateOfBirth,
        communityName,
        communityCode,
      });
      storage.setToken(response.data.token);
      storage.setUser(response.data.user);
      setToken(response.data.token);
      setUser(response.data.user);
      return response.data.user as User;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    storage.clearAll();
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      updateName: (name: string) => setUser(current => current && { ...current, name }),
      logout,
    }),
    [user, token, loading]
  );

  if (restoring) return <p role="status">Checking session…</p>;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
