import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  developerOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  developerOnly,
}) => {
  const { user, token } = useAuthStore();
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Developer dashboard is restricted strictly via Supabase developer flag
  if (developerOnly && !user.is_developer) {
    return <Navigate to="/dashboard" replace />;
  }

  // Require servant leaders to select/create and validate their Area Database before proceeding to dashboard
  const isServantLeader = user.role !== 'member';
  const hasAssignedArea = Boolean(user.area_id && user.area_id.trim());
  const isGlobalAdmin = Boolean(user.is_developer || user.role === 'national_coordinator');

  if (isServantLeader && !hasAssignedArea && !isGlobalAdmin && location.pathname !== '/select-area') {
    return <Navigate to="/select-area" replace />;
  }

  if (isServantLeader && hasAssignedArea && !isGlobalAdmin && location.pathname === '/select-area') {
    return <Navigate to="/dashboard" replace />;
  }

  // If member tries to access servant views, redirect to /member portal (permit developers to visit /dev)
  if (user.role === 'member' && location.pathname !== '/member') {
    if (user.is_developer && location.pathname === '/dev') {
      return <>{children}</>;
    }
    return <Navigate to="/member" replace />;
  }

  // If servant tries to access /member without being a member (permit developers to test /member)
  if (location.pathname === '/member' && user.role !== 'member' && !user.is_developer) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && !user.is_developer) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
