import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as authApi from '../api/auth';
import { ApiError } from '../api/client';
import {
  clearSession,
  loadSession,
  saveSession,
  setAuthRedirectSuppressed,
  type StoredSession,
} from './session';

interface AuthContextValue {
  session: StoredSession | null;
  isAuthenticated: boolean;
  isLoggingOut: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<StoredSession | null>(() => loadSession());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (isLoggingOut && location.pathname === '/') {
      setIsLoggingOut(false);
      setAuthRedirectSuppressed(false);
    }
  }, [isLoggingOut, location.pathname]);

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
    setIsLoggingOut(true);
    setAuthRedirectSuppressed(true);
    try {
      await authApi.logout();
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 401) {
        setIsLoggingOut(false);
        setAuthRedirectSuppressed(false);
        throw err;
      }
    } finally {
      clearSession();
      setSession(null);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      isLoggingOut,
      login,
      register,
      logout,
    }),
    [session, isLoggingOut, login, register, logout],
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
