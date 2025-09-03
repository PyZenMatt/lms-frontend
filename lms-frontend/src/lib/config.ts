// src/lib/config.ts
// Base URL resiliente: accetta sia .../api che .../api/v1 e garantisce che API.base finisca con /api/v1

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const BASE = RAW_BASE.replace(/\/+$/, ""); // senza trailing slash
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
