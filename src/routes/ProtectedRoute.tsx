// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardHome } from "@/lib/dashboard";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authChecked, isAuthenticated } = useAuth();
  const location = useLocation();

  // Don't redirect to login until we've checked auth status to avoid
  // transient redirects when booting/refresh is in progress.
  if (!authChecked) {
    return <div className="p-6 text-sm text-muted-foreground">Verifica sessione</div>;
  }
  if (!isAuthenticated) {
    try {
      window.dispatchEvent(new CustomEvent('auth_guard_redirect', { detail: { reason: 'not_authenticated', path: location.pathname, authChecked, isAuthenticated } }));
  } catch (e) { console.debug('[AuthGuard] dispatch failed', e); }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

type Allow = "student" | "teacher" | "admin";

export function RoleRoute({
  children,
  allow,
  redirectTo = "/forbidden",
}: {
  children: React.ReactNode;
  allow: Allow | Allow[];
  /** Dove reindirizzare in caso di ruolo non ammesso (default: "/forbidden") */
  redirectTo?: string;
}) {
  const { authChecked, isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (!authChecked) {
    return <div className="p-6 text-sm text-muted-foreground">Verifica permessi</div>;
  }
  if (!isAuthenticated) {
    try {
      window.dispatchEvent(new CustomEvent('auth_guard_redirect', { detail: { reason: 'not_authenticated', path: location.pathname, authChecked, isAuthenticated, role } }));
  } catch (e) { console.debug('[AuthGuard] dispatch failed', e); }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is not yet known, show a pending state instead of forbidding.
  if (!role) {
    return <div className="p-6 text-sm text-muted-foreground">Verifica permessi</div>;
  }

  // If the user landed on the generic /dashboard route, redirect them to their
  // canonical dashboard/home for the role instead of treating it as forbidden.
  if (location.pathname === "/dashboard") {
    return <Navigate to={getDashboardHome(role)} replace />;
  }

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!allowed.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
