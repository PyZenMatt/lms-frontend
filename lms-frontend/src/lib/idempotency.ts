// src/lib/idempotency.ts
// Genera e gestisce chiavi idempotenti per operazioni critiche (es. applyDiscount).
// La chiave sopravvive al reload (sessionStorage) e viene riusata su retry.

const NS = "idemp:";

export function makeIdempotencyKey(prefix = "checkout"): string {
  const base = `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  const key = `${NS}${base}`;
  try {
    sessionStorage.setItem(key, "pending");
  } catch {
    // sessionStorage può fallire in ambienti particolari; ignoriamo silenziosamente
  }
  return base;
}

export function keepIdempotencyKey(baseKey: string) {
  try {
    sessionStorage.setItem(`${NS}${baseKey}`, "pending");
  } catch { /* ignore storage errors */ }
}

export function clearIdempotencyKey(baseKey: string) {
  try {
    sessionStorage.removeItem(`${NS}${baseKey}`);
  } catch { /* ignore storage errors */ }
}

export function isIdempotencyPending(baseKey: string): boolean {
  try {
    return sessionStorage.getItem(`${NS}${baseKey}`) === "pending";
  } catch {
    return false;
  }
}
