import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  requiredRole?: 'ADMIN' | 'USER';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    // Basic fallback if role is insufficient
    return <Navigate to="/app/facilities/dashboard" replace />;
  }

  return <Outlet />;
};
