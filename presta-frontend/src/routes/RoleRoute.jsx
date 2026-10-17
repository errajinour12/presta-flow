import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  // Generally, user.role is a string like "ADMIN" or "PRESTATAIRE".
  const userRole = user?.role;

  if (!userRole || !allowedRoles.includes(userRole)) {
    // Role not authorized, maybe redirect to their own dashboard or login
    if (userRole === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (userRole === 'PRESTATAIRE') return <Navigate to="/prestataire/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
