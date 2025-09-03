import { api } from "../lib/api"

// Tipi
export type WalletInfo = {
  address?: string | null;
  balance_teo: number;      // saldo in TEO
  balance_eur?: number;     // opzionale, se il BE lo fornisce
  updated_at?: string;
  [k: string]: unknown;
};

export type WalletTransaction = {
  id: string | number;
  type: "earn" | "spend" | "refund" | "airdrop" | "adjustment" | string;
  amount_teo: number;       // positivo earn, negativo spend
  description?: string;
  created_at: string;
  reference?: string;
  [k: string]: unknown;
};

type DrfPage<T> = { count: number; next?: string | null; previous?: string | null; results: T[] };

type Ok<T> = { ok: true; status: number; data: T };
type Err = { ok: false; status: number; error?: unknown; tried?: string[] };
export type Result<T> = Ok<T> | Err;

async function tryGet<T>(paths: string[], params?: Record<string, unknown>): Promise<Result<T>> {
  const tried: string[] = [];
  for (const p of paths) {
    tried.push(p);
    const res = await api.get<T>(p, { params });
    if (res.ok) return { ok: true, status: res.status, data: res.data as T };
    // se 404/405, prova il prossimo endpoint
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error, tried };
  }
  return { ok: false, status: 404, error: "All endpoints not found", tried };
}

async function tryPost<T>(paths: string[], body?: Record<string, unknown>): Promise<Result<T>> {
  const tried: string[] = [];
  for (const p of paths) {
    tried.push(p);
    const res = await api.post<T>(p, body);
    if (res.ok) return { ok: true, status: res.status, data: res.data as T };
    if (![404, 405].includes(res.status)) return { ok: false, status: res.status, error: res.error, tried };
  }
  return { ok: false, status: 404, error: "All endpoints not found", tried };
}

export function coerceNumber(v: unknown): number {
  if (v === null || v === undefined) return NaN;
  if (typeof v === 'number') return Number.isFinite(v) ? (v as number) : NaN;
  if (typeof v === 'string') {
    const n = Number(v as string);
    return Number.isFinite(n) ? n : NaN;
  }
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.parsedValue === 'number' && Number.isFinite(obj.parsedValue as number)) return obj.parsedValue as number;
    if (typeof obj.source === 'string') {
      const n = Number(obj.source);
      if (Number.isFinite(n)) return n;
    }
    if (typeof obj.value === 'number' && Number.isFinite(obj.value as number)) return obj.value as number;
    if (typeof obj.value === 'string') {
      const n = Number(obj.value);
      if (Number.isFinite(n)) return n;
    }
    return NaN;
  }
  return NaN;
}

/** GET wallet dell’utente */
export async function getWallet(): Promise<Result<WalletInfo>> {
  // Canonical DB-based TeoCoin endpoints (no speculative fallbacks)
  // Backend variants we support: /v1/... and /api/v1/... and /api/... (client will normalize)
  const endpoints = ["/v1/teocoin/balance/", "/api/v1/teocoin/balance/", "/api/teocoin/balance/"];

  // If profile endpoint returns user profile, normalize it to WalletInfo
  const res = await tryGet<Record<string, unknown>>(endpoints);
  if (!res.ok) return res as Err;

  const data = res.data as Record<string, unknown>;
  console.debug("getWallet: raw response", data);

  // db_teocoin_views.TeocoinBalanceView returns { success: true, balance: {...} }
  if (data && data.balance && typeof data.balance === "object") {
    const b = data.balance as Record<string, unknown>
    // various backends return numbers as strings; coerce safely
    const available = coerceNumber(b.available_balance ?? b.available ?? b["available"] ?? NaN)
    const total = coerceNumber(b.total_balance ?? b.total ?? NaN)
    const address = (b.wallet_address ?? data.wallet_address ?? null) as string | null
    const updated_at = (b.updated_at ?? data.updated_at ?? undefined) as string | undefined

    // If backend provides both total and staked, derive available = total - staked
    const staked = coerceNumber(b.staked_balance ?? b.staked ?? NaN);
    const availableFromTotal = (Number.isFinite(total) && Number.isFinite(staked)) ? Math.max(0, total - staked) : NaN;

    const walletInfo: WalletInfo = {
      address,
      // Prefer explicit available when present. Otherwise prefer computed available (total - staked) when possible.
      // Fallback to total if neither available nor computable available exist.
      balance_teo: Number.isFinite(available) ? available : Number.isFinite(availableFromTotal) ? availableFromTotal : Number.isFinite(total) ? total : 0,
      balance_eur: undefined,
      updated_at,
      raw: data,
    }
  console.debug("getWallet: normalized walletInfo", walletInfo);

    return { ok: true, status: res.status, data: walletInfo };
  }

  // If shape unexpected, return an error with tried info for debugging
  return { ok: false, status: res.status, error: "Unexpected balance payload", tried: (res as unknown as { tried?: string[] }).tried };
}

/** GET movimenti wallet paginati */
export async function getTransactions(page = 1, page_size = 20, url?: string): Promise<Result<DrfPage<WalletTransaction>>> {
  // If caller provides a full URL (next/previous), fetch that directly (converted to relative path)
  if (typeof url === 'string' && url.length > 0) {
    try {
      let path = url
      // If absolute URL, convert to path+search so api.joinUrl can normalize with BASE
      if (/^https?:\/\//i.test(url)) {
        try {
          const u = new URL(url);
          path = u.pathname + (u.search || '');
        } catch {
          // fallback: use as-is
          path = url
        }
      }
      const res = await api.get<unknown>(path);
      if (!res.ok) return res as Err;
      const payload = res.data as unknown;

      // reuse existing normalization below by cloning local logic
      const resultsField = (payload as Record<string, unknown>)?.results;
      const transactionsField = (payload as Record<string, unknown>)?.transactions;
      const dataField = (payload as Record<string, unknown>)?.data;

      const arr: unknown[] =
        Array.isArray(resultsField) ? (resultsField as unknown[]) :
        Array.isArray(transactionsField) ? (transactionsField as unknown[]) :
        Array.isArray(dataField) ? (dataField as unknown[]) :
        Array.isArray(payload) ? (payload as unknown[]) : [];

      const count = typeof (payload as Record<string, unknown>)?.count === 'number'
        ? (payload as Record<string, unknown>).count as number
        : (Array.isArray(arr) ? arr.length : 0);

      const results: WalletTransaction[] = arr.map((r, i) => {
        const obj = r as Record<string, unknown>;
        const amountRaw = obj.amount_teo ?? obj.amount ?? obj.value ?? 0;
        return {
          id: obj.id ?? obj.tx_id ?? i,
          type: (obj.type ?? obj.transaction_type ?? obj.kind ?? 'unknown') as string,
          amount_teo: typeof amountRaw === 'number' ? amountRaw as number : Number(amountRaw ?? 0),
          description: (obj.description ?? obj.note ?? obj.notes ?? obj.memo ?? null) as string | null,
          created_at: (obj.created_at ?? obj.timestamp ?? new Date().toISOString()) as string,
          reference: (obj.reference ?? obj.tx_hash ?? obj.hash ?? null) as string | null,
          ...obj,
        } as WalletTransaction;
      });

      const nextRaw = (payload as Record<string, unknown>)?.next;
      const prevRaw = (payload as Record<string, unknown>)?.previous;
      const next = typeof nextRaw === 'string' ? nextRaw : null;
      const previous = typeof prevRaw === 'string' ? prevRaw : null;

      return { ok: true, status: res.status, data: { count, next, previous, results } };
    } catch (err) {
      return { ok: false, status: 0, error: err } as Err;
    }
  }

  // Prefer explicit API-prefixed TeoCoin transactions endpoint for DB-backed history
  // Keep fallbacks for legacy v1 paths and other implementations
  const endpoints = [
    // Preferred: server API that returns DB TeoCoin transactions
    "/api/v1/teocoin/transactions/",
    "/api/v1/teocoin/transactions/history/",
    "/api/v1/wallet/transactions/",

    // Legacy /v1 variants (kept for backward compatibility)
    "/v1/teocoin/transactions/",
    "/v1/teocoin/transactions/history/",
    "/v1/wallet/transactions/",

    // Other possible shapes used historically
    "/v1/services/earnings/history/",
    "/v1/users/me/wallet/transactions/",
    "/api/v1/services/earnings/history/",
    "/api/v1/users/me/wallet/transactions/",
  ];

  const res = await tryGet<unknown>(endpoints, { page, page_size, limit: page_size });
  if (!res.ok) return res as Err;
  const payload = res.data as unknown;

  // Support multiple shapes: DRF { results: [] }, legacy { transactions: [] }, { data: [] } or raw array
  const resultsField = (payload as Record<string, unknown>)?.results;
  const transactionsField = (payload as Record<string, unknown>)?.transactions;
  const dataField = (payload as Record<string, unknown>)?.data;

  const arr: unknown[] =
    Array.isArray(resultsField) ? (resultsField as unknown[]) :
    Array.isArray(transactionsField) ? (transactionsField as unknown[]) :
    Array.isArray(dataField) ? (dataField as unknown[]) :
    Array.isArray(payload) ? (payload as unknown[]) : [];

  const count = typeof (payload as Record<string, unknown>)?.count === 'number'
    ? (payload as Record<string, unknown>).count as number
    : (Array.isArray(arr) ? arr.length : 0);

  const results: WalletTransaction[] = arr.map((r, i) => {
    const obj = r as Record<string, unknown>;
    const amountRaw = obj.amount_teo ?? obj.amount ?? obj.value ?? 0;
    return {
      id: obj.id ?? obj.tx_id ?? i,
      type: (obj.type ?? obj.transaction_type ?? obj.kind ?? 'unknown') as string,
      amount_teo: typeof amountRaw === 'number' ? amountRaw as number : Number(amountRaw ?? 0),
      description: (obj.description ?? obj.note ?? obj.notes ?? obj.memo ?? null) as string | null,
      created_at: (obj.created_at ?? obj.timestamp ?? new Date().toISOString()) as string,
      reference: (obj.reference ?? obj.tx_hash ?? obj.hash ?? null) as string | null,
      ...obj,
    } as WalletTransaction;
  });

  const nextRaw = (payload as Record<string, unknown>)?.next;
  const prevRaw = (payload as Record<string, unknown>)?.previous;
  const next = typeof nextRaw === 'string' ? nextRaw : null;
  const previous = typeof prevRaw === 'string' ? prevRaw : null;

  return { ok: true, status: res.status, data: { count, next, previous, results } };
}

/**
 * POST verifica sconto in checkout lato BE
 * body es.: { course_id, price_eur }
 * risposta attesa: {
 *   available: boolean,
 *   discount_eur?: number,
 *   final_price_eur?: number,
 *   teo_spent?: number,
 *   message?: string,
 *   ... }
 */
export async function checkDiscount(body: {
  course_id?: number;
  price_eur: number;
  [k: string]: unknown;
}): Promise<Result<Record<string, unknown>>> {
  // Use DB-based calculate-discount endpoint
  const endpoints = ["/v1/teocoin/calculate-discount/"];
  // backend expects `course_price` field in some implementations; include it for compatibility
  const payload: Record<string, unknown> = { ...body } as Record<string, unknown>;
  if (payload.course_price === undefined && payload.price_eur !== undefined) {
    payload.course_price = payload.price_eur;
  }
  return tryPost<Record<string, unknown>>(endpoints, payload);
}

/**
 * POST applicazione sconto TEO / pagamento ibrido
 * Se fornito course_id → preferisce l'endpoint course-scoped:
 *   POST /v1/courses/{course_id}/hybrid-payment/
 * Altrimenti fallback generico:
 *   POST /v1/teocoin/apply-discount/
 */
export async function applyDiscount(body: {
  course_id?: number;
  price_eur?: number;
  discount_percent?: number;
  student_address?: string;
  student_signature?: string;
  idempotency_key?: string;
  [k: string]: unknown;
}): Promise<Result<Record<string, unknown>>> {
  const { course_id, ...rest } = body || {};

  // Try course-scoped hybrid payment when course_id present
  if (typeof course_id === 'number' && Number.isFinite(course_id)) {
    const courseEndpoint = `/v1/courses/${course_id}/hybrid-payment/`;
    const coursePayload: Record<string, unknown> = { ...rest } as Record<string, unknown>;
    if (coursePayload.course_price === undefined && coursePayload.price_eur !== undefined) {
      coursePayload.course_price = coursePayload.price_eur;
    }
    const courseRes = await api.post<Record<string, unknown>>(courseEndpoint, coursePayload);
    // If OK or error not 404/405, return it (don't fallback)
    if (courseRes.ok || ![404, 405].includes(courseRes.status)) return courseRes as Result<Record<string, unknown>>;
    // otherwise continue to fallbacks
  }

  const fallbacks = ["/v1/teocoin/apply-discount/", "/v1/payments/apply-discount/"];
  const payload: Record<string, unknown> = { course_id, ...rest } as Record<string, unknown>;
  if (payload.course_price === undefined && payload.price_eur !== undefined) payload.course_price = payload.price_eur;
  return tryPost<Record<string, unknown>>(fallbacks, payload);
}

// Backwards-compatible aliases requested by integration:
// rename ambiguous alias to emphasize this is DB wallet
export const getDbWallet = getWallet;
export const calculateDiscount = checkDiscount;

/**
 * POST request to mint TEO on-chain (server will bridge to DB ledger).
 * body: { amount: string|number, idem_key?: string }
 */

/**
 * POST request to burn TEO on-chain (server will bridge to DB ledger).
 * body: { amount: string|number, idem_key?: string }
 */

/**
 * Request a withdrawal (DB -> MetaMask chain mint)
 * body: { amount: string|number, metamask_address?: string }
 */

/**
 * POST request to withdraw (DB -> MetaMask) using server-side mint
 * Preferred endpoints (compat): /api/v1/wallet/withdraw/ -> /api/v1/blockchain/wallet/withdraw/ -> /api/v1/teocoin/withdraw/
 */
// Legacy DB-backed client functions removed: mint, burn, requestWithdraw, withdraw

// --- On-chain client-side wrappers (use MetaMask / user wallet)
// Note: client-side mint/burn wrappers that directly call MetaMask have been
// removed to enforce the architecture where the DB is the single source of
// truth for balances and mint operations must go through the server-side
// bridge (server signs and mints). Burn (user-side) still uses the
// on-chain helpers live under `src/web3/*` (importable via `@onchain/*`).
// Example: `WalletActions` imports burn helpers from `@onchain/ethersWeb3`.

// Note: legacy DB-backed mint/burn/withdraw functions removed from client-side.

/**
 * Verify a deposit transaction on-chain and credit DB (chain -> DB)
 * body: { tx_hash: string }
 */
export async function verifyDeposit(tx_hash: string): Promise<Result<Record<string, unknown>>> {
  if (!tx_hash || typeof tx_hash !== 'string') return { ok: false, status: 400, error: 'tx_hash required' };
  const payload = { tx_hash } as Record<string, unknown>;
  const endpoints = [
  // try blockchain app verify route first
  "/api/v1/blockchain/deposit/verify/",
  "/v1/teocoin/burn-deposit/",
  "/api/v1/teocoin/burn-deposit/",
  "/api/teocoin/burn-deposit/",
  "/v1/teocoin/deposit/verify/",
  "/api/v1/teocoin/deposit/verify/",
  ];
  return tryPost<Record<string, unknown>>(endpoints, payload);
}

/**
 * POST /api/blockchain/tx-status/ or equivalent endpoints to inquire transaction status
 */
// checkTxStatus has been migrated to `features/wallet/walletApi.getTxStatus`.
// Callers should import directly from there to use the canonical GET-based API.

/**
 * Convenience wrapper to refresh balance via existing getWallet() call and return normalized WalletInfo
 */
export async function refreshBalance(): Promise<Result<WalletInfo>> {
  return getWallet();
}

// Delegates for wallet connect / SIWE-lite helpers — keep facade-only functions

/**
 * getChallenge(): POST /api/v1/users/me/wallet/challenge/
 * Returns normalized { status: 'ok'|'error', nonce?, message?, error_code? }
 */
// getChallenge migrated to `features/wallet/walletApi.getChallenge`.

/**
 * linkWallet(address, signature): POST /api/v1/users/me/wallet/link/
 * Returns { status: 'ok'|'error', wallet_address?, message?, error_code? }
 */
// linkWallet migrated to `features/wallet/walletApi.linkWallet`.

/**
 * unlinkWallet(): DELETE /api/v1/users/me/wallet/
 * Returns { status: 'ok'|'error', message?, error_code? }
 */
// unlinkWallet migrated to `features/wallet/walletApi.unlinkWallet`.
