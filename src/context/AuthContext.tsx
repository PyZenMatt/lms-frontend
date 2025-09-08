// src/context/AuthContext.tsx
/* eslint-disable react-refresh/only-export-components */
import React, { useContext, useEffect, useMemo, useState } from "react";
import { getDashboardHome } from "@/lib/dashboard";
import { useNavigate, useLocation } from "react-router-dom";
import { API } from "../lib/config";
import {
  saveTokens,
  clearTokens,
  getRoleFromToken,
  getAccessToken,
  getRefreshToken,
  isAccessTokenExpired,
  hasToken,
  type Tokens,
} from "../lib/auth";
import { logout as apiClientLogout } from "../lib/api";
import { getProfile } from "../services/profile";
import { getDbWallet, getWallet } from "../services/wallet";
import { getUserFromToken } from "../lib/auth";
import type { Result } from "../services/wallet";
type WalletResult = Result<unknown>;

type Role = "student" | "teacher" | "admin" | null;

type AuthCtx = {
  booting: boolean;
  /** Indicates the initial auth boot/verification completed at least once */
  authChecked: boolean;
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
  authChecked: false,
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
  // Start conservatively: do not assume authenticated until boot completes.
  const [{ booting, isAuthenticated, role, authChecked }, setAuth] = useState<{
    booting: boolean;
    isAuthenticated: boolean;
    role: Role;
    authChecked: boolean;
  }>({ booting: true, isAuthenticated: false, role: null, authChecked: false });

  const navigate = useNavigate();
  const location = useLocation();

  // redirect helper: prefer ?redirect query, then location.state.from, then role map
  const redirectAfterAuth = React.useCallback((roleArg?: Role) => {
    try {
      const params = new URLSearchParams(location.search);
      const redirectParam = params.get("redirect");
      const fromState = (location.state as unknown as { from?: { pathname?: string } })?.from?.pathname;
      const effectiveRole = roleArg ?? role;
      const target = redirectParam || fromState || getDashboardHome(effectiveRole);
      navigate(target, { replace: true });
    } catch (err) {
      console.debug('[Auth] redirectAfterAuth failed', err);
  try { navigate(getDashboardHome(role), { replace: true }); } catch (_err) { navigate('/dashboard', { replace: true }); }
    }
  }, [location.search, location.state, navigate, role]);

  // Boot: se ho token ma non ho role nel JWT, provo a leggerlo dal server
  useEffect(() => {
    (async () => {
      // If there are no tokens stored, mark auth as checked and anonymous immediately.
      if (!hasToken()) {
        setAuth({ booting: false, isAuthenticated: false, role: null, authChecked: true });
        return;
      }
      // If access token is missing or expired, avoid treating user as authenticated
      const access = getAccessToken();
      if (!access || isAccessTokenExpired(access)) {
        // Clear any stale tokens and bail out as anonymous. Do not attempt silent refresh here.
        try { clearTokens(); } catch (e) { console.debug('[Auth] boot clearTokens failed', e); }
  setAuth({ booting: false, isAuthenticated: false, role: null, authChecked: true });
        return;
      }

      // Validate the access token by calling the role endpoint. If the call
      // fails (network error or 401/403) consider the tokens invalid and clear
      // local state so the UI doesn't treat the client as authenticated while
      // the backend is unreachable or the token is invalid/rotated.
      let r = getRoleFromToken();
      let roleCheckOk = false;
      try {
        const res = await fetch(API.role, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (res.ok) {
          const data = await res.json();
          r = (data?.role as Role) ?? r;
          roleCheckOk = true;
        } else {
          // Non-ok response (401/403/5xx) -> treat as invalid for boot
          console.debug('[Auth] boot role check returned not-ok', res.status);
        }
      } catch (e) {
        console.debug('[Auth] boot role fetch failed', e);
      }

      if (!roleCheckOk) {
        try { clearTokens(); } catch (e) { console.debug('[Auth] boot clearTokens failed', e); }
  setAuth({ booting: false, isAuthenticated: false, role: null, authChecked: true });
        return;
      }

      // attempt to populate local UI-friendly user cache so legacy figma shim components
      // (which read `localStorage.artlearn_user`) display real data in the sidebar.
      try {
        const profile = await getProfile();
      // Prefer the DB-backed wallet, but fall back to legacy getWallet() if the DB endpoint fails
      let walletRes = await getDbWallet().catch(() => ({ ok: false } as WalletResult));
      if (!walletRes || !walletRes.ok) {
        console.debug('[Auth] getDbWallet failed or returned non-ok, attempting legacy getWallet fallback', walletRes);
        try {
          const legacy = await getWallet().catch(() => ({ ok: false } as WalletResult));
          if (legacy && legacy.ok) {
            console.debug('[Auth] legacy getWallet succeeded and will be used as fallback', legacy);
            walletRes = legacy;
          } else {
            console.debug('[Auth] legacy getWallet fallback also failed', legacy);
          }
        } catch (e) {
          console.debug('[Auth] legacy getWallet threw', e);
        }
      }
      const tokensCount = walletRes && walletRes.ok ? ((walletRes.data as Record<string, unknown>)?.balance_teo ?? 0) : 0;
        if (profile) {
          const profileRec = profile as Record<string, unknown>;
      const walletAddress = (walletRes && walletRes.ok && walletRes.data && typeof walletRes.data === 'object' && 'address' in (walletRes.data as Record<string, unknown>)) ? ((walletRes.data as unknown) as Record<string, unknown>).address as string | null : null;
          const artUser = {
            id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? ""),
            name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")),
            email: profile.email ?? "",
            role: profile.role ?? r ?? "student",
            tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
            avatar: profile.avatar ?? null,
            walletAddress,
          };
          try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user failed', e); }
        } else {
          // fallback: use token info and wallet result so UI isn't empty
          const tokenUser = getUserFromToken();
          const walletAddress = walletRes && walletRes.ok ? (((walletRes as unknown) as Record<string, any>).data?.address ?? null) : null;
          const artUser = {
            id: tokenUser?.username ?? tokenUser?.email ?? "",
            name: (tokenUser?.username) ?? (((tokenUser?.first_name ?? "") + " " + (tokenUser?.last_name ?? "")).trim()) ?? tokenUser?.email ?? "",
            email: tokenUser?.email ?? "",
            role: r ?? "student",
            tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
            avatar: null,
            walletAddress,
          };
          try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user fallback failed', e); }
        }
  } catch (err) { console.debug('[Auth] profile sync failed', err); }
  setAuth({ booting: false, isAuthenticated: true, role: r, authChecked: true });
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
  setAuth({ booting: false, isAuthenticated: !unverified, role: finalRole, authChecked: true });
    // populate artlearn_user so legacy UI components (figma shim) pick up real data
    try {
      const profile = await getProfile();
      // Prefer DB-backed wallet, fall back to legacy getWallet() if needed
      let walletRes = await getDbWallet().catch(() => ({ ok: false } as WalletResult));
      if (!walletRes || !walletRes.ok) {
        console.debug('[Auth] postAuth getDbWallet failed or returned non-ok, attempting legacy getWallet fallback', walletRes);
        try {
          const legacy = await getWallet().catch(() => ({ ok: false } as WalletResult));
          if (legacy && legacy.ok) {
            console.debug('[Auth] postAuth legacy getWallet succeeded and will be used as fallback', legacy);
            walletRes = legacy;
          } else {
            console.debug('[Auth] postAuth legacy getWallet fallback also failed', legacy);
          }
        } catch (e) {
          console.debug('[Auth] postAuth legacy getWallet threw', e);
        }
      }
      const tokensCount = walletRes && walletRes.ok ? ((walletRes.data as Record<string, unknown>)?.balance_teo ?? 0) : 0;
      if (profile) {
        const profileRec = profile as Record<string, unknown>;
  const walletAddress = walletRes && walletRes.ok ? (((walletRes as unknown) as Record<string, any>).data?.address ?? null) : null;
        const artUser = {
          id: profileRec?.id ? String(profileRec.id) : (profile.username ?? profile.email ?? ""),
          name: (profile.username ?? ((`${profile.first_name ?? ""} ${profile.last_name ?? ""}`).trim() || profile.email || "User")),
          email: profile.email ?? "",
          role: profile.role ?? finalRole ?? "student",
          tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
          avatar: profile.avatar ?? null,
          walletAddress,
        };
        try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user failed', e); }
      } else {
        const tokenUser = getUserFromToken();
        const walletAddress = walletRes && walletRes.ok ? ((walletRes as any).data?.address ?? null) : null;
        const artUser = {
          id: tokenUser?.username ?? tokenUser?.email ?? "",
          name: (tokenUser?.username) ?? (((tokenUser?.first_name ?? "") + " " + (tokenUser?.last_name ?? "")).trim()) ?? tokenUser?.email ?? "",
          email: tokenUser?.email ?? "",
          role: finalRole ?? "student",
          tokens: Number.isFinite(Number(tokensCount)) ? Number(tokensCount) : 0,
          avatar: null,
          walletAddress,
        };
        try { localStorage.setItem("artlearn_user", JSON.stringify(artUser)); } catch (e) { console.debug('[Auth] save artlearn_user fallback failed', e); }
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
    // Fire-and-forget async logout to backend so server-side session cookie is cleared
    (async () => {
      try {
        const refresh = getRefreshToken();
        try {
          // Attempt to notify backend so it can delete session cookies and blacklist refresh token
          await fetch(API.logout, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(refresh ? { refresh } : {}),
          });
        } catch (e) {
          // swallow network errors but log for debugging
          console.debug('[Auth] logout: backend call failed', e);
        }
      } catch (e) {
        console.debug('[Auth] logout: prepare backend logout failed', e);
      } finally {
            try {
              // Clear tokens in both auth helper and API client (two different storage keys)
              try { clearTokens(); } catch (e) { console.debug('[Auth] logout: clearTokens failed', e); }
              try { apiClientLogout(); } catch (e) { console.debug('[Auth] logout: apiClientLogout failed', e); }
              try { localStorage.removeItem("auth_tokens"); } catch { /* best-effort */ }
            } catch (e) {
              console.debug('[Auth] logout: clearing storages failed', e);
            }
        try {
          // Remove legacy UI cache
          localStorage.removeItem("artlearn_user");
        } catch (e) {
          console.debug('[Auth] logout: remove artlearn_user failed', e);
        }
        // Clear react-query cache and mark auth checked so guards stop waiting
        try {
          // Lazily import to avoid circular deps at module top-level in some bundlers
          const qc = await import("../lib/queryClientInstance");
          try { qc.queryClient.clear(); } catch (e) { console.debug('[Auth] logout: queryClient.clear failed', e); }
        } catch (e) { console.debug('[Auth] logout: queryClient import failed', e); }

        // Attempt to clear service worker caches to avoid stale cached routes/resources
        try {
          if (typeof window !== 'undefined' && 'caches' in window) {
            const keys = await caches.keys().catch(() => [] as string[]);
            await Promise.all(keys.map((k) => caches.delete(k).catch(() => false))).catch(() => {});
          }
  try { navigator.serviceWorker?.controller?.postMessage?.({ type: 'AUTH_LOGOUT' }); } catch (e) { console.debug('[Auth] logout: sw postMessage failed', e); }
        } catch (e) { console.debug('[Auth] logout: clearing caches failed', e); }

        setAuth({ booting: false, isAuthenticated: false, role: null, authChecked: true });
  try { window.dispatchEvent(new CustomEvent('auth:logout')); } catch (e) { console.debug('[Auth] logout dispatch failed', e); }
  // Ensure we land on the login page and avoid any SPA boot redirect to /courses.
  try { window.location.replace('/login'); } catch { try { navigate('/login', { replace: true }); } catch { /* ignore */ } }
      }
    })();
  }, [navigate]);

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
  setAuth({ booting: false, isAuthenticated: true, role: finalRole, authChecked: true });
  }, []);

  // Unified post-auth handler: persist tokens, set auth state, and perform the
  // correct navigation. If the backend signals the account as unverified we
  // redirect to the verify-email flow instead of protected routes.
  

  const value = useMemo<AuthCtx>(
    () => ({
      booting,
  authChecked: Boolean(authChecked),
      isAuthenticated,
      role,
  // isTeacher should be true only for explicit teacher accounts.
  // Administrators are a distinct role and must not mount teacher-only UI.
  isTeacher: role === "teacher",
  // defaults to satisfy AuthCtx - real values provided in fullValue below
  pendingTeoCount: 0,
  setPendingTeoCount: (n: number) => { void n; },
  login,
  logout,
  refreshRole,
  redirectAfterAuth,
  setSession,
  postAuth,
    }),
  [booting, isAuthenticated, role, authChecked, redirectAfterAuth, login, logout, refreshRole, setSession, postAuth]
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
