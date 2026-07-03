import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen font-mono2 text-lg">Booting terminal…</div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
