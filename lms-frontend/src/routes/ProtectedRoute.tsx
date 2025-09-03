// src/routes/ProtectedRoute.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { booting, isAuthenticated } = useAuth();
  const location = useLocation();

  if (booting) {
    return <div className="p-6 text-sm text-muted-foreground">Verifica sessione…</div>;
  }
  if (!isAuthenticated) {
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
  const { booting, isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (booting) {
    return <div className="p-6 text-sm text-muted-foreground">Verifica permessi…</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const allowed = Array.isArray(allow) ? allow : [allow];
  if (!role || !allowed.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
