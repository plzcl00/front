import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoggingOut } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    if (isLoggingOut) {
      return null;
    }
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return children;
}
