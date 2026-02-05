import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-screen bg-main flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-muted text-sm font-medium animate-pulse">Autenticando...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
