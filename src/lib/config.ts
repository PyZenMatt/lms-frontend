// src/lib/config.ts
// Base URL resiliente: legge VITE_API_BASE_URL o fallback a window.location.origin in runtime.
// Vogliamo uno schema coerente: API.base finirà con `/api/v1` (Schema B: BASE = origin + /api, V1 = BASE + /v1).
const API_ORIGIN = ((import.meta as any).env?.VITE_API_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, "");
const BASE = API_ORIGIN.endsWith("/api") ? API_ORIGIN : `${API_ORIGIN}/api`;
const V1 = BASE.endsWith("/v1") ? BASE : `${BASE}/v1`;

export const API = {
  base: V1,
  token: `${V1}/token/`,
  refresh: `${V1}/token/refresh/`,
  logout: `${V1}/logout/`,
  role: `${V1}/dashboard/role/`,
  notifications: {
    list: `${V1}/notifications/`,
    unreadCount: `${V1}/notifications/unread-count/`,
  },
};

// Export di compatibilità se in giro ci sono import "vecchi"
export const API_BASE_URL = BASE;
export const API_LOGIN_PATH = "/v1/token/";
export const API_REFRESH_PATH = "/v1/token/refresh/";
export const API_PING_PATH = "/v1/ping/";

// feature flags and blockchain config
export const VITE_DEV_FORCE_ENABLE_MINT_BURN = (import.meta.env.VITE_DEV_FORCE_ENABLE_MINT_BURN === 'true');
export const VITE_TEO_CONTRACT_ADDRESS = import.meta.env.VITE_TEO_CONTRACT_ADDRESS ?? '';
export const VITE_CHAIN_ID = import.meta.env.VITE_CHAIN_ID ?? '80002';
