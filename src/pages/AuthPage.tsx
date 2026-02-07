import { Navigate } from 'react-router-dom';

// Demo mode - redirect straight to app
export default function AuthPage() {
  return <Navigate to="/" replace />;
}
