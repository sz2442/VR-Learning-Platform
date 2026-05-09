import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface RoleRouteProps {
  role: string;
  redirectTo?: string;
}

export function RoleRoute({ role, redirectTo = '/' }: RoleRouteProps) {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  const isValid = checkAuth();
  if (!isAuthenticated || !isValid) return <Navigate to="/login" replace />;
  if (user?.role !== role) return <Navigate to={redirectTo} replace />;

  return <Outlet />;
}
