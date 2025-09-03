import { api } from "@/lib/api";
import type { WalletChallenge, WalletLinkResponse } from "./types";

// Challenge/link paths are resolved inside functions to avoid duplication

const WITHDRAW_PATHS = [
  "/v1/blockchain/wallet/withdraw/",
  "/api/v1/blockchain/wallet/withdraw/",
  "/api/blockchain/wallet/withdraw/",
  // older simplified path
  "/api/v1/blockchain/wallet/withdraw/",
];

const ONCHAIN_MINT_PATHS = [
  "/api/onchain/mint/",
  "/api/v1/onchain/mint/",
  "/api/v1/blockchain/onchain/mint/",
  "/v1/onchain/mint/",
];

const TX_STATUS_PATHS = [
  "/v1/blockchain/wallet/tx-status/",
  "/api/v1/blockchain/wallet/tx-status/",
  "/api/blockchain/wallet/tx-status/",
];

async function tryPost<T>(paths: string[], body?: unknown) {
  for (const p of paths) {
    const res = await api.post<T>(p, body);
    if (res.ok) return { ok: true as const, status: res.status, data: res.data };
    if (![404, 405].includes(res.status)) return { ok: false as const, status: res.status, error: res.error };
  }
  return { ok: false as const, status: 404, error: "not_found" };
}

export async function getChallenge(): Promise<{ ok: true; data: WalletChallenge } | { ok: false; status: number; error?: unknown }> {
  // Direct HTTP implementation to avoid delegating back to wallet service module
  const paths = ["/api/v1/users/me/wallet/challenge/", "/v1/users/me/wallet/challenge/", "/users/me/wallet/challenge/"];
  for (const p of paths) {
    const res = await api.post<Record<string, unknown>>(p, {});
    if (res.ok) {
      const d = (res.data ?? {}) as Record<string, unknown>;
      const nested = (d['data'] as Record<string, unknown> | undefined) ?? {};
      const nonce = (d['nonce'] as string | undefined) ?? (nested['nonce'] as string | undefined) ?? undefined;
      const message = (d['message'] as string | undefined) ?? (nested['message'] as string | undefined) ?? undefined;
      return { ok: true, data: { nonce, message } as WalletChallenge };
    }
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error };
  }
  return { ok: false, status: 404, error: 'not_found' };
}

export async function linkWallet(address: string, signature: string): Promise<{ ok: true; data: WalletLinkResponse } | { ok: false; status: number; error?: unknown }> {
  const paths = ["/api/v1/users/me/wallet/link/", "/v1/users/me/wallet/link/", "/users/me/wallet/link/"];
  const payload = { address, signature } as Record<string, unknown>;
  for (const p of paths) {
    const res = await api.post<Record<string, unknown>>(p, payload);
    if (res.ok) {
      const d = (res.data ?? {}) as Record<string, unknown>;
      return { ok: true, data: { wallet_address: (d['wallet_address'] as string | undefined) ?? (d['address'] as string | undefined) ?? undefined } as WalletLinkResponse };
    }
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error };
  }
  return { ok: false, status: 404, error: 'not_found' };
}

export async function unlinkWallet() {
  const paths = ["/api/v1/users/me/wallet/", "/v1/users/me/wallet/", "/users/me/wallet/"];
  for (const p of paths) {
    const res = await api.delete(p);
    if (res.ok) return { ok: true };
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error };
  }
  return { ok: false, status: 404, error: 'not_found' };
}

export async function withdraw(amount?: string, related_id?: string) {
  const body: any = {};
  if (amount) body.amount = amount;
  if (related_id) body.related_id = related_id;
  const res = await tryPost<{ tx_id: number; tx_hash?: string }>(WITHDRAW_PATHS, body);
  if (res.ok) return { ok: true, data: res.data };
  return { ok: false, status: res.status, error: res.error };
}

export async function onchainMint(amount?: string, to?: string) {
  const body: any = {};
  if (amount) body.amount = amount;
  if (to) body.to = to;
  const res = await tryPost<{ tx_hash?: string; tx_id?: number }>(ONCHAIN_MINT_PATHS, body);
  if (res.ok) return { ok: true, data: res.data };
  return { ok: false, status: res.status, error: res.error };
}

export async function getTxStatus(txIdentifier: string) {
  // try GET to each base path
  for (const base of TX_STATUS_PATHS) {
    const path = base.endsWith("/") ? `${base}${txIdentifier}/` : `${base}/${txIdentifier}/`;
  const res = await api.get<unknown>(path);
    if (res.ok) return { ok: true, data: res.data };
    if (![404].includes(res.status)) return { ok: false, status: res.status, error: res.error };
  }
  return { ok: false, status: 404, error: "not_found" };
}
