import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/feedback/PageSpinner';

/**
 * Route guard for auth pages (login, signup, forgot-password).
 *
 * If the user is already authenticated, redirect them away —
 * to the path they came from (if any) or /dashboard.
 * Prevents logged-in users from seeing login/signup forms.
 */
function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner message="Loading…" />;
  }

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || '/dashboard';
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}

export { GuestRoute };
