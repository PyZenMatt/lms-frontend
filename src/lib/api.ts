// src/lib/api.ts
// Lightweight API client with SimpleJWT refresh and global loading events.
// - Emits window CustomEvent("api:loading", { detail: { delta: +1|-1 } }) before/after each request.
// - Returns a uniform shape: { ok, status, data?, error? }.
// - Reads base URL from VITE_API_BASE_URL (default http://127.0.0.1:8000/api).
// - Handles 401 → refresh token (once) via `${BASE}${API_REFRESH_PATH}`.

import eventBus from "./eventBus";
import { showToast as showToastLocal } from "./toast";

export type ApiResult<T = any> = {
  ok: boolean;
  status: number;
  data?: T;
  error?: any;
};

type RequestOptions = {
  params?: Record<string, any>;
  headers?: Record<string, string>;
  body?: any;
  noAuth?: boolean;
  // if true, a 403 response will emit a dedicated fatal event so callers can choose to navigate
  // to a forbidden page or take other global action. Default: false (soft 403).
  fatal403?: boolean;
  signal?: AbortSignal;
  // internal
  _retried?: boolean;
  // allow legacy keys used across the codebase (eg. `query`) without type errors
  [k: string]: unknown;
};

// base "origin" of the API (without trailing slash). Prefer Vite env, fall back to window.location.origin.
// We pick Schema B: BASE = origin + '/api' and ensure we don't introduce a duplicate '/api'.
const API_ORIGIN = ((import.meta as any)?.env?.VITE_API_BASE_URL ?? window.location.origin).replace(/\/+$/, "");
const BASE = API_ORIGIN.endsWith("/api") ? API_ORIGIN : `${API_ORIGIN}/api`;

// SimpleJWT refresh endpoint path (relative to BASE).
// Backend exposes JWT refresh at /api/v1/token/refresh/ (see authentication.urls)
export const API_REFRESH_PATH = "/v1/token/refresh/";

// ---- Token storage (localStorage) ----
const TOKENS_KEY = "auth_tokens"; // { access: string, refresh: string }
const LEGACY_ACCESS_KEY = "access_token";
const SIMPLE_ACCESS_KEY = "access"; // some codepaths store raw access token here
const LEGACY_REFRESH_KEY = "refresh_token";

type Tokens = { access?: string | null; refresh?: string | null };

function loadTokens(): Tokens {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    if (raw) return JSON.parse(raw);
    // Fallback to legacy keys used elsewhere in the app
    const access = localStorage.getItem(LEGACY_ACCESS_KEY);
    const refresh = localStorage.getItem(LEGACY_REFRESH_KEY);
  // also support simple access key
  const simple = localStorage.getItem(SIMPLE_ACCESS_KEY);
  if (access || refresh || simple) return { access: access ?? simple ?? null, refresh: refresh ?? null };
    return {};
  } catch {
    return {};
  }
}

function saveTokens(t: Tokens) {
  const next = JSON.stringify({ access: t.access ?? null, refresh: t.refresh ?? null });
  localStorage.setItem(TOKENS_KEY, next);
  // Also write legacy keys so older helpers (src/lib/auth.ts) keep working
  try {
    if (t.access) localStorage.setItem(LEGACY_ACCESS_KEY, t.access);
    else localStorage.removeItem(LEGACY_ACCESS_KEY);
    if (t.refresh) localStorage.setItem(LEGACY_REFRESH_KEY, t.refresh);
    else localStorage.removeItem(LEGACY_REFRESH_KEY);
  } catch {
    // ignore
  }
}

function clearTokens() {
  localStorage.removeItem(TOKENS_KEY);
  try {
    localStorage.removeItem(LEGACY_ACCESS_KEY);
    localStorage.removeItem(LEGACY_REFRESH_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent("auth:logout"));
}

// ---- Helpers ----
function normalizeBase(u: string): string {
  let s = String(u || "").trim();
  if (!s) return API_ORIGIN;
  // remove trailing slash
  if (s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function joinUrl(base: string, path: string): string {
  let p = path.startsWith("/") ? path : `/${path}`;
  // If base already ends with '/api' and path starts with '/api', avoid duplication
  try {
    if (base.endsWith("/api") && p.startsWith("/api")) {
      p = p.replace(/^\/api/, "");
    }
  } catch {
    // fallback to naive join on any error
  }
  // Join and collapse accidental double slashes (except after protocol)
  return `${base}${p}`.replace(/([^:]\/)\/+/, "$1");
}

// Safer join that normalizes base and path and prevents duplicate /api segments.
function joinApi(base: string, path: string): string {
  const b = String(base || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  if (b.endsWith("/api") && p.startsWith("/api/")) return b + p.slice(4);
  return `${b}${p}`.replace(/([^:]\/)\/+/, "$1");
}

// Defensive JSON reader: ensures we fail early and include text when server returns HTML.
async function readJson(res: Response) {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Non-JSON (${res.status}): ${txt.slice(0, 200)}`);
  }
  return res.json();
}

function buildQuery(params?: Record<string, any>): string {
  if (!params) return "";
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) v.forEach((item) => q.append(k, String(item)));
    else q.append(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function isJsonResponse(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

function dispatchLoading(delta: 1 | -1, key?: string) {
  try {
    // Emit on new eventBus for internal consumers
    try {
      eventBus.emit("api:loading", { delta, key });
    } catch {
      // ignore
    }
    // Back-compat: also emit old window CustomEvent so existing listeners keep working
    try {
      window.dispatchEvent(new CustomEvent("api:loading", { detail: { delta } }));
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
}

// ---- Refresh flow ----
async function refreshAccessToken(): Promise<boolean> {
  const { refresh } = loadTokens();
  if (!refresh) return false;
  dispatchLoading(1);
  try {
  const url = joinApi(BASE, API_REFRESH_PATH);
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
  const data = await readJson(res).catch(() => ({}));
    const access = data?.access || data?.access_token;
    if (typeof access === "string" && access.length > 10) {
      saveTokens({ access, refresh });
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    dispatchLoading(-1);
  }
}

// ---- Core request ----
async function coreRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const signals = options.signal
    ? [options.signal, controller.signal]
    : [controller.signal];

  // Merge headers
  const headers: Record<string, string> = {
    "accept": "application/json",
    ...options.headers,
  };

  // Auth header
  const { access } = loadTokens();
  // Public allowlist: if the path matches a known public endpoint, avoid attaching Authorization
  const PUBLIC_ALLOWLIST = [
    "/v1/register/",
    "/v1/token/",
    "/v1/token/refresh/",
    "/v1/password/",
    "/v1/password/reset/",
    "/v1/password/confirm/",
  ];
  const pathIsPublic = typeof path === "string" && PUBLIC_ALLOWLIST.some((p) => path.startsWith(p) || path === p);
  const skipAuth = Boolean(options.noAuth) || pathIsPublic;
  if (!skipAuth && access) {
    headers["authorization"] = `Bearer ${access}`;
  }

  // Body
  let body: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null && method !== "GET") {
    if (options.body instanceof FormData) {
      body = options.body; // let browser set multipart boundary
    } else {
      headers["content-type"] = headers["content-type"] || "application/json";
      body = headers["content-type"].includes("application/json")
        ? JSON.stringify(options.body)
        : (options.body as any);
    }
  }

  // URL
  const url = joinApi(BASE, path) + buildQuery(options.params);

  // Fire request
  dispatchLoading(1);
  let res: Response | null = null;
  try {
    res = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      signal: signals[signals.length - 1],
    });

    // 401 → try refresh once
    if (res.status === 401 && !options._retried) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return coreRequest<T>(method, path, { ...options, _retried: true });
      }
    }

    // No content
    if (res.status === 204) {
      return { ok: true, status: res.status, data: undefined as any };
    }

    // Parse
    let data: any = undefined;
    if (isJsonResponse(res)) {
      data = await res.json().catch(() => undefined);
    } else {
      const txt = await res.text().catch(() => "");
      data = txt;
    }

    if (!res.ok) {
      // 403/401 cleanup if needed
      if (res.status === 401 || res.status === 403) {
        // optionally clear tokens only on explicit instruction
        // clearTokens();
      }
      const detail = { status: res.status, url, method, data };
      try {
        eventBus.emit("api:error", detail);
      } catch {
        // ignore
      }
      try {
        window.dispatchEvent(new CustomEvent("api:error", { detail }));
      } catch {
        // ignore
      }

      // If caller requested fatal403 behavior, emit a dedicated event so a central
      // listener may choose to navigate to /forbidden or show a global modal.
      try {
        if (res.status === 403 && options?.fatal403) {
          const fatalDetail = { status: res.status, url, method, data };
          try { eventBus.emit("api:fatal403", fatalDetail); } catch {}
          try { window.dispatchEvent(new CustomEvent("api:fatal403", { detail: fatalDetail })); } catch {}
        }
      } catch {
        // ignore
      }

      const err = data ?? { message: "Request failed" };
      const normalizedError = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));
      return { ok: false, status: res.status, error: normalizedError };
    }

    return { ok: true, status: res.status, data: data as T };
  } catch (error: any) {
    const message = error?.message || String(error);
    const detail = { status: 0, url, method, message };
    try {
      eventBus.emit("api:error", detail);
    } catch {
      // ignore
    }
    try {
      window.dispatchEvent(new CustomEvent("api:error", { detail }));
    } catch {
      // ignore
    }
  return { ok: false, status: 0, error: new Error(message) };
  } finally {
    dispatchLoading(-1);
    // abort controller cleanup (no op)
  }
}

// ---- Public API wrapper ----
class ApiClient {
  get<T>(path: string, opts: Omit<RequestOptions, "body"> = {}) {
    return coreRequest<T>("GET", path, opts);
  }
  post<T>(path: string, body?: any, opts: Omit<RequestOptions, "body"> = {}) {
    return coreRequest<T>("POST", path, { ...opts, body });
  }
  put<T>(path: string, body?: any, opts: Omit<RequestOptions, "body"> = {}) {
    return coreRequest<T>("PUT", path, { ...opts, body });
  }
  patch<T>(path: string, body?: any, opts: Omit<RequestOptions, "body"> = {}) {
    return coreRequest<T>("PATCH", path, { ...opts, body });
  }
  delete<T>(path: string, opts: Omit<RequestOptions, "body"> = {}) {
    return coreRequest<T>("DELETE", path, opts);
  }
}

export const api = new ApiClient();

// Back-compat wrapper for older callers that use `apiFetch(path, init)`
export async function apiFetch<T = any>(path: string, init: any = {}, retryOn401 = true): Promise<ApiResult<T>> {
  const method = (String(init?.method || "GET").toUpperCase() as "GET" | "POST" | "PUT" | "PATCH" | "DELETE");
  const options: RequestOptions = {
    headers: init?.headers,
    body: init?.body,
    noAuth: init?.noAuth,
    signal: init?.signal,
    params: init?.params,
    _retried: init?._retried,
  };
  // Note: coreRequest handles retry-on-401 internally via options._retried; we respect retryOn401 by
  // skipping refresh if retryOn401 is false (pass _retried = true to avoid a retry).
  if (!retryOn401) options._retried = true;
  return coreRequest<T>(method, path, options);
}

// ---- Auth helpers (optional) ----
export function setTokens(tokens: Tokens) {
  saveTokens(tokens);
}
export function getTokens(): Tokens {
  return loadTokens();
}
export function logout() {
  clearTokens();
}
export function getApiBase() {
  return BASE;
}

// Convenience: attach to window for debugging (dev only)
// @ts-ignore
if (typeof window !== "undefined") (window as any).__api_base__ = BASE;

// Back-compat: if ToastHost exists at runtime, pick its showToast function via dynamic import.
// Use a module-scoped variable so browser ESM environments don't rely on CommonJS `exports`.
export type ToastOptions = { variant: "success" | "error" | "info"; message: string; title?: string };

let runtimeShowToast: ((opts: ToastOptions) => void) | undefined;
if (typeof window !== "undefined") {
  // Dynamic import avoids circular deps at module evaluation time and works in ESM.
  import("@/components/ToastHost")
    .then((m: any) => {
      const candidate = m?.showToast;
      if (typeof candidate === "function") runtimeShowToast = candidate;
    })
    .catch(() => {
      // ignore missing ToastHost
    });
}

export function showToast(opts: ToastOptions) {
  try {
    if (typeof runtimeShowToast === "function") {
      runtimeShowToast(opts);
      return;
    }
    // Fallback to local toast helper so callers using lib/api.showToast still work
    try {
      showToastLocal({ message: opts.message, variant: opts.variant, title: opts.title });
    } catch {
      // swallow
    }
  } catch {
    // swallow errors in environments without a ToastHost
  }
}
