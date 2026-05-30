import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import {
  clearSession,
  loadSession,
  saveSession,
  type StoredSession,
} from './session';

interface AuthContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());

  const applyLogin = useCallback((username: string, token: string, expiresInMs: number) => {
    saveSession(username, token, expiresInMs);
    setSession(loadSession());
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.login({ username, password });
      applyLogin(username.trim(), res.token, res.expiresInMs);
    },
    [applyLogin],
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await authApi.register({ username, password });
      applyLogin(username.trim(), res.token, res.expiresInMs);
    },
    [applyLogin],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        throw err;
      }
    } finally {
      clearSession();
      setSession(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
