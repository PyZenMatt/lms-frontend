import { api } from "@/lib/api";

type Result = { ok: true } | { ok: false; status: number; error?: any };

export async function linkWallet(address: string): Promise<Result> {
  if (!address) return { ok: false, status: 400, error: "address required" };
  const endpoints = [
    "/v1/users/me/link-wallet/",
    "/api/v1/users/me/link-wallet/",
    "/api/users/me/link-wallet/",
  ];
  for (const p of endpoints) {
    const res = await api.post<Record<string, unknown>>(p, { address });
    if (res.ok) return { ok: true };
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error };
  }
  return { ok: false, status: 404, error: "no endpoint" };
}
