// src/context/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../lib/config";
import {
  saveTokens,
  loadTokens,
  clearTokens,
  getRoleFromToken,
  getAccessToken,
  type Tokens,
} from "../lib/auth";
import { getProfile } from "../services/profile";
import { getDbWallet } from "../services/wallet";

type Role = "student" | "teacher" | "admin" | null;

type AuthCtx = {
  booting: boolean;
  isAuthenticated: boolean;
  role: Role;
  isTeacher: boolean;
  pendingTeoCount: number;
  setPendingTeoCount: (n: number) => void;
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshRole: () => Promise<void>;
  redirectAfterAuth: (roleArg?: Role) => void;
  setSession: (tokens: Tokens, role?: Role) => void;
  postAuth: (payload: { tokens?: Tokens; role?: Role; unverified?: boolean }) => Promise<void>;
};

const Ctx = React.createContext<AuthCtx | undefined>(undefined);
export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // During HMR or early render the provider might not be mounted yet.
    // Return a benign fallback to avoid throwing and crashing the whole app.
    // Consumers should handle isAuthenticated/booting flags accordingly.
    return {
      booting: false,
      isAuthenticated: false,
      role: null,
      isTeacher: false,
      pendingTeoCount: 0,
  setPendingTeoCount: (n: number) => { void n; },
      login: async () => false,
      logout: () => {},
      refreshRole: async () => {},
      redirectAfterAuth: () => {},
      setSession: () => {},
      postAuth: async () => {},
    } as AuthCtx;
  }
  return ctx;
};

async function httpJSON<T>(
  url: string,
  body: unknown,
  extraHeaders?: Record<string, string>
): Promise<{ ok: boolean; status: number; data?: T }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(extraHeaders || {}),
    },
    body: JSON.stringify(body ?? {}),
  });
  let data: unknown = undefined;
  const ct = res.headers.get("content-type") || "";
  try {
    if (!ct.includes("application/json")) {
      const txt = await res.text().catch(() => "");
      console.debug('[Auth] httpJSON non-json response', { status: res.status, text: txt.slice(0,200) });
      return { ok: res.ok, status: res.status, data: undefined };
    }
    data = await res.json();
  } catch (e) {
    const txt = await res.text().catch(() => "");
    console.debug('[Auth] httpJSON parse failed', e, txt.slice(0,200));
  }
  return { ok: res.ok, status: res.status, data: data as T | undefined };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [{ booting, isAuthenticated, role }, setAuth] = useState<{
    booting: boolean;
    isAuthenticated: boolean;
    role: Role;
  }>({ booting: true, isAuthenticated: !!loadTokens(), role: getRoleFromToken() });

  const navigate = useNavigate();
  const location = useLocation();

  // redirect helper: prefer ?redirect query, then location.state.from, then role map
  const redirectAfterAuth = React.useCallback((roleArg?: Role) => {
    try {
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get("redirect");
      const fromState = (location.state as unknown as { from?: { pathname?: string } })?.from?.pathname;
      const effectiveRole = roleArg ?? role;
      const target = redirectParam || fromState || (effectiveRole === "admin" ? "/admin" : effectiveRole === "teacher" ? "/teacher" : "/dashboard");
      navigate(target, { replace: true });
    } catch (err) {
      console.debug('[Auth] redirectAfterAuth failed', err);
      navigate("/dashboard", { replace: true });
    }
  }, [location.search, location.state, navigate, role]);

  // Boot: se ho token ma non ho role nel JWT, provo a leggerlo dal server
  useEffect(() => {
    (async () => {
      const tokens = loadTokens();
      if (!tokens) {
        setAuth({ booting: false, isAuthenticated: false, role: null });
        return;
      }
      let r = getRoleFromToken();
      if (!r) {
        try {
          const res = await fetch(API.role, {
            headers: { Authorization: `Bearer ${tokens.access}` },
          });
          if (res.ok) {
            const data = await res.json();
            r = (data?.role as Role) ?? r;
          }
  } catch (e) { console.debug('[Auth] profile sync failed inner', e); }
      }
      // attempt to populate local UI-friendly user cache so legacy figma shim components
      // (which read `localStorage.artlearn_user`) display real data in the sidebar.
      try {
        const profile = await getProfile();
        if (profile) {
          const walletRes = await getDbWallet();
          const tokensCount = walletRes.ok ? (walletRes.data.balance_teo ?? 0) : 0;
          const profileRec = profile as Record<string, unknown>;
          const artUser = {
            id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? ""),
            name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")),
            email: profile.email ?? "",
            role: profile.role ?? r ?? "student",
            tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
            avatar: profile.avatar ?? null,
            walletAddress: profile.wallet_address ?? (walletRes.ok ? walletRes.data.address ?? null : null),
          };
          try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user failed', e); }
        }
  } catch (err) { console.debug('[Auth] profile sync failed', err); }
      setAuth({ booting: false, isAuthenticated: true, role: r });
    })();
  }, []);

  // Unified post-auth handler: persist tokens, set auth state, and perform the
  // correct navigation. If the backend signals the account as unverified we
  // redirect to the verify-email flow instead of protected routes.
  const postAuth = React.useCallback(async ({ tokens, role: roleArg, unverified = false }: { tokens?: Tokens; role?: Role; unverified?: boolean }) => {
    if (tokens) {
      try {
        saveTokens(tokens);
        console.debug("[Auth] postAuth: tokens saved");
      } catch (err) {
        console.debug("[Auth] postAuth: saveTokens failed", err);
      }
    }
    const finalRole = roleArg ?? getRoleFromToken();
    setAuth({ booting: false, isAuthenticated: !unverified, role: finalRole });
    // populate artlearn_user so legacy UI components (figma shim) pick up real data
    try {
      const profile = await getProfile();
      if (profile) {
        const walletRes = await getDbWallet();
        const tokensCount = walletRes.ok ? (walletRes.data.balance_teo ?? 0) : 0;
        const profileRec = profile as Record<string, unknown>;
        const artUser = {
          id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? ""),
          name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")),
          email: profile.email ?? "",
          role: profile.role ?? finalRole ?? "student",
          tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
          avatar: profile.avatar ?? null,
          walletAddress: profile.wallet_address ?? (walletRes.ok ? walletRes.data.address ?? null : null),
        };
        try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user failed', e); }
      }
  } catch (err) { console.debug('[Auth] postAuth profile sync failed', err); }
    if (unverified) {
      try {
        navigate("/verify-email/sent", { replace: true });
        return;
  } catch (err) { console.debug("[Auth] boot role fetch failed", err); }
    }
    try {
      console.debug("[Auth] postAuth: redirecting for role", finalRole);
      redirectAfterAuth(finalRole);
  } catch (err) { console.debug("[Auth] login: role fetch failed", err); }
  }, [navigate, redirectAfterAuth]);

  const login = React.useCallback(async (usernameOrEmail: string, password: string): Promise<boolean> => {
    // 1) tentativo: email/password (CustomTokenObtainPair)
    let r = await httpJSON<Tokens>(API.token, { email: usernameOrEmail, password });
    // 2) fallback: username/password (SimpleJWT default) se 400
    if (!r.ok && r.status === 400) {
      r = await httpJSON<Tokens>(API.token, { username: usernameOrEmail, password });
    }
    if (!r.ok || !r.data?.access || !r.data?.refresh) return false;

    // Delegate to the unified post-auth flow which handles persistence, state and redirect
    const deducedRole = getRoleFromToken();
    let finalRole = deducedRole;
    try {
      const res = await fetch(API.role, {
        headers: { Authorization: `Bearer ${r.data.access}` },
      });
      if (res.ok) {
        const data = await res.json();
        finalRole = (data?.role as Role) ?? finalRole;
      }
    } catch (err) { console.debug("[Auth] refreshRole failed", err); }

    try {
      await postAuth({ tokens: { access: r.data.access, refresh: r.data.refresh }, role: finalRole, unverified: false });
  } catch (err) { console.debug("[Auth] postAuth navigate/redirect failed", err); }
    return true;
  }, [postAuth]);

  const logout = React.useCallback(() => {
    clearTokens();
    setAuth({ booting: false, isAuthenticated: false, role: null });
  }, []);

  const refreshRole = React.useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(API.role, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setAuth((s) => ({ ...s, role: (data?.role as Role) ?? s.role }));
      }
  } catch (e) { console.debug('[Auth] redirectAfterAuth navigate failed', e); }
  }, []);

  const setSession = React.useCallback((tokens: Tokens, roleArg?: Role) => {
    try {
      saveTokens(tokens);
  } catch (e) { console.debug('[Auth] login role fetch failed', e); }
    const finalRole = roleArg ?? getRoleFromToken();
    setAuth({ booting: false, isAuthenticated: true, role: finalRole });
  }, []);

  // Unified post-auth handler: persist tokens, set auth state, and perform the
  // correct navigation. If the backend signals the account as unverified we
  // redirect to the verify-email flow instead of protected routes.
  

  const value = useMemo<AuthCtx>(
    () => ({
      booting,
      isAuthenticated,
      role,
      isTeacher: role === "teacher" || role === "admin",
      pendingTeoCount: 0,
      setPendingTeoCount: (_n: number) => setPendingTeoCount(_n),
  login,
  logout,
  refreshRole,
  redirectAfterAuth,
  setSession,
  postAuth,
    }),
  [booting, isAuthenticated, role, redirectAfterAuth, login, logout, refreshRole, setSession, postAuth]
  );

  // Maintain pendingTeoCount state so pages can update the navbar badge.
  const [pendingTeoCount, setPendingTeoCount] = useState<number>(0);

  const fullValue = useMemo<AuthCtx>(
    () => ({
      ...value,
      pendingTeoCount,
      setPendingTeoCount,
    }),
    [value, pendingTeoCount]
  );

  return <Ctx.Provider value={fullValue}>{children}</Ctx.Provider>;
}
