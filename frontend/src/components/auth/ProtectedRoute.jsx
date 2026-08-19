import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/feedback/PageSpinner';

/**
 * Route guard that requires authentication.
 *
 * - While AuthContext is hydrating → show full-page spinner.
 * - If unauthenticated → redirect to /login with the current path
 *   stored in location.state.from (for redirect-after-login).
 * - If authenticated → render child routes via <Outlet />.
 *
 * Accepts optional `allowedRoles` prop for forward compatibility
 * (Phase 7 will implement role-based restriction).
 */
function ProtectedRoute({ allowedRoles: _allowedRoles }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageSpinner message="Checking authentication…" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export { ProtectedRoute };
