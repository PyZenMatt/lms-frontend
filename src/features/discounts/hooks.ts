import { useCallback, useState } from "react";
import { discountsApi } from "./api";
import { usePendingDiscounts as usePendingDiscountsShared } from '@/hooks/usePendingDiscounts'
import type { DecisionResponse, PendingListItem } from "./types";

function errMsg(e: unknown): string {
  if (!e) return "";
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as { message?: unknown }).message ?? "");
  }
  return String(e);
}

function isPromise(v: unknown): v is Promise<unknown> {
  return !!v && typeof v === "object" && typeof ((v as unknown) as { then?: unknown }).then === "function";
}

// Re-export the shared hook under the feature name so existing imports keep working.
export const usePendingDiscounts = usePendingDiscountsShared

export function usePendingDiscountsFeature() {
  const { data: pendingData, error: pendingError, isLoading, refetch: refetchPending } = usePendingDiscountsShared()

  // Transform pendingData if needed into PendingListItem shape used by UI
  const items = (pendingData ?? []) as unknown as PendingListItem[]
  const loading = Boolean(isLoading)
  const error = pendingError ? String(pendingError) : null

  return { items, loading, error, refetch: refetchPending }
}

export function useAcceptDecline(opts?: { onAfterChange?: (resp: DecisionResponse) => void | Promise<void> }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const accept = useCallback(async (decisionId: number) => {
    setBusyId(decisionId);
    setError(null);
    try {
      const resp = await discountsApi.acceptDecision(decisionId);
      // Await the callback if it returns a promise to ensure refetch completes
  const maybePromise = opts?.onAfterChange?.(resp);
  if (isPromise(maybePromise)) await (maybePromise as unknown as Promise<void>);
      return;
    } catch (e: unknown) {
      setError(errMsg(e) || "Errore");
      throw e;
    } finally {
      setBusyId(null);
    }
  }, [opts]);

  const decline = useCallback(async (decisionId: number) => {
    setBusyId(decisionId);
    setError(null);
    try {
      const resp = await discountsApi.declineDecision(decisionId);
  const maybePromise = opts?.onAfterChange?.(resp);
  if (isPromise(maybePromise)) await (maybePromise as unknown as Promise<void>);
      return;
    } catch (e: unknown) {
      setError(errMsg(e) || "Errore");
      throw e;
    } finally {
      setBusyId(null);
    }
  }, [opts]);

  return { accept, decline, busyId, error };
}
