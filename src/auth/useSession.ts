import { useAuth } from './AuthContext';

export function useSession() {
  const { session } = useAuth();
  if (!session) {
    throw new Error('Session required');
  }
  return { session, username: session.username, isAuthenticated: true as const };
}

export function useOptionalSession() {
  const { session, isAuthenticated } = useAuth();
  return { session, username: session?.username ?? null, isAuthenticated };
}
