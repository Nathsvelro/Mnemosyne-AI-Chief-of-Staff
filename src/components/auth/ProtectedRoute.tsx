import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

// Demo mode - no authentication required
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return <>{children}</>;
}
