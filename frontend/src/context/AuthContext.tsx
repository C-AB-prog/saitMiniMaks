import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../types/api';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: { phone: string; password: string }) => Promise<void>;
  register: (payload: { name: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'assistant-grows-token';

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await authApi.me(token);
        setUser(currentUser);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void bootstrap();
  }, [token]);

  const persistAuth = (nextToken: string, nextUser: User) => {
    localStorage.setItem(STORAGE_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login: async (payload) => {
        const response = await authApi.login(payload);
        persistAuth(response.accessToken, response.user);
      },
      register: async (payload) => {
        const response = await authApi.register(payload);
        persistAuth(response.accessToken, response.user);
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setUser(null);
      }
    }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
};
