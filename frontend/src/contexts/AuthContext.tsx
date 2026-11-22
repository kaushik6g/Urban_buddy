import { createContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/services';
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
    communityName?: string,
    communityCode?: string
  ) => Promise<User>;
  updateName: (name: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [token, setToken] = useState<string | null>(storage.getToken());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      storage.clearAll();
      setToken(null);
      setUser(null);
      return;
    }
    storage.setToken(token);
    storage.setUser(user);
  }, [token, user]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
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
        communityName,
        communityCode,
      });
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
