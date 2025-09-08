import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import getDashboardHome from '@/lib/dashboard';

export default function DashboardRedirect() {
  const { authChecked, isAuthenticated, role } = useAuth();
  if (!authChecked) return <div className="p-6 text-sm text-muted-foreground">Verifica sessione</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!role) return <div className="p-6 text-sm text-muted-foreground">Verifica permessi</div>;
  return <Navigate to={getDashboardHome(role)} replace />;
}
