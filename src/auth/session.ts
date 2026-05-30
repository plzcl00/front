const TOKEN_KEY = 'ediary_token';
const USERNAME_KEY = 'ediary_username';
const EXPIRES_KEY = 'ediary_expires_at';

export interface StoredSession {
  token: string;
  username: string;
  expiresAt: number;
}

export function loadSession(): StoredSession | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const username = localStorage.getItem(USERNAME_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token || !username || !expiresAt) {
    return null;
  }
  const expires = Number(expiresAt);
  if (Number.isNaN(expires) || expires <= Date.now()) {
    clearSession();
    return null;
  }
  return { token, username, expiresAt: expires };
}

export function saveSession(username: string, token: string, expiresInMs: number): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + expiresInMs));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function getToken(): string | null {
  return loadSession()?.token ?? null;
}
