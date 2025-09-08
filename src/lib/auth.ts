// src/lib/auth.ts
export type Tokens = { access: string; refresh: string };

const ACCESS_KEY = "access_token";
const REFRESH_KEY = "refresh_token";

export function saveTokens(t: Tokens) {
  localStorage.setItem(ACCESS_KEY, t.access);
  localStorage.setItem(REFRESH_KEY, t.refresh);
}

export function loadTokens(): Tokens | null {
  const access = localStorage.getItem(ACCESS_KEY);
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!access || !refresh) return null;
  return { access, refresh };
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

type Role = "student" | "teacher" | "admin" | null;

export function getRoleFromToken(): Role {
  const raw = getAccessToken();
  if (!raw) return null;
  try {
    const payload = JSON.parse(atob(raw.split(".")[1] || ""));
    // 1) role diretto nel JWT
    if (typeof payload.role === "string") return payload.role as Role;
    // 2) flag booleani nel JWT
    if (payload.is_admin) return "admin";
    if (payload.is_teacher) return "teacher";
    // 3) default prudente
    return "student";
  } catch {
    return null;
  }
}

export type JwtUser = {
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  [k: string]: any;
};

export function getUserFromToken(): JwtUser | null {
  const raw = getAccessToken();
  if (!raw) return null;
  try {
    const payload = JSON.parse(atob(raw.split(".")[1] || ""));
    const user: JwtUser = {};
    if (payload.username) user.username = payload.username;
    if (payload.email) user.email = payload.email;
    if (payload.first_name) user.first_name = payload.first_name;
    if (payload.last_name) user.last_name = payload.last_name;
    // some tokens embed user under 'user' key
    if (payload.user && typeof payload.user === "object") {
      const u = payload.user as any;
      if (!user.username && u.username) user.username = u.username;
      if (!user.email && u.email) user.email = u.email;
      if (!user.first_name && u.first_name) user.first_name = u.first_name;
      if (!user.last_name && u.last_name) user.last_name = u.last_name;
    }
    return user;
  } catch {
    return null;
  }
}

// Check token expiry (JWT `exp` claim). Returns true if token is expired or
// missing. We include a small leeway (in seconds) to avoid borderline cases.
export function isAccessTokenExpired(token?: string | null, leewaySeconds = 30): boolean {
  const raw = token ?? getAccessToken();
  if (!raw) return true;
  try {
    const payload = JSON.parse(atob(String(raw).split(".")[1] || ""));
    const exp = payload?.exp;
    if (typeof exp !== "number") return true;
    const now = Math.floor(Date.now() / 1000);
    return exp <= (now + leewaySeconds) ? true : false;
  } catch {
    return true;
  }
}

/**
 * Quick predicate: is there any token stored client-side (access or refresh)?
 */
export function hasToken(): boolean {
  return Boolean(getAccessToken() || getRefreshToken());
}
