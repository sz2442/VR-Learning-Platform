import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
    const { isAuthenticated, checkAuth } = useAuthStore();
    const location = useLocation();

    // Check if token is still valid
    const isValid = checkAuth();

    if (!isAuthenticated || !isValid) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Use Outlet to render nested routes
    return <Outlet />;
}