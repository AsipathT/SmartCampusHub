import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import { getNavConfig } from '../config/navigation';

interface ProtectedRouteProps {
  /** If provided, only these roles can access children. Admins bypass all role checks. */
  allowedRoles?: UserRole[];
}

/**
 * ProtectedRoute
 * ─────────────────────────────────────────────────────────────────────────────
 * Guards any nested routes against:
 *  1. Unauthenticated access → redirect to /login
 *  2. Insufficient role      → redirect to the user's own default route
 *
 * ADMIN is a super-role and always passes any role check.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  // 1. Not logged in → login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role-gated route: check membership
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission =
      user?.role === 'ADMIN' ||                          // ADMIN bypasses all checks
      allowedRoles.includes(user?.role as UserRole);

    if (!hasPermission) {
      // Redirect to the user's own default landing page
      const config = getNavConfig(user?.role as UserRole);
      return <Navigate to={config.defaultRoute} replace />;
    }
  }

  return <Outlet />;
};
