import { useCallback, useEffect, useState } from "react";
import { discountsApi } from "./api";
import { getPendingDiscountSnapshots } from "@/services/rewards";
import type { DecisionResponse, PendingListItem } from "./types";

function errMsg(e: unknown): string {
  if (!e) return "";
  if (typeof e === 'string') return e;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as any).message);
  }
  return String(e);
}

function isPromise(v: unknown): v is Promise<unknown> {
  return !!v && typeof v === "object" && typeof ((v as unknown) as { then?: unknown }).then === "function";
}

export function usePendingDiscounts() {
  const [data, setData] = useState<PendingListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await discountsApi.listPending();
      // If the canonical discounts API returns an empty list or malformed data,
      // fall back to the rewards snapshots endpoint which contains the real pending snapshots.
      const maybe = res?.results ?? [];
      if (!Array.isArray(maybe) || maybe.length === 0) {
        // fallback to snapshots
        try {
          const snaps = await getPendingDiscountSnapshots();
          if (snaps && snaps.ok && Array.isArray(snaps.data)) {
            const mapped: PendingListItem[] = (snaps.data as unknown[]).map((s) => {
              const item = s as Record<string, unknown>;
              const snapshot: any = {
                id: Number(item.id) || 0,
                course_title: (item.course_title as string) || (item.course_title as string | undefined) || "",
                status: (item.status as string) === "pending" ? "pending" : "closed",
                price_eur: String(item.price_eur ?? item.course_price ?? "0"),
                discount_percent: String(item.discount_percent ?? item.discount_percentage ?? "0"),
                student_pay_eur: String(item.student_pay_eur ?? item.student_pay ?? "0"),
                teacher_eur: String(item.teacher_eur ?? item.teacher_fee ?? "0"),
                platform_eur: String(item.platform_eur ?? item.platform_fee ?? "0"),
                teacher_accepted_teo: item.offered_teacher_teo ? String(item.offered_teacher_teo) : null,
                final_teacher_teo: item.final_teacher_teo ? String(item.final_teacher_teo) : null,
                created_at: item.created_at ? String(item.created_at) : undefined,
              };
              // Extract pending decision id from known fields (multiple backend shapes exist)
              const pdRaw = (item.pending_decision_id ?? item.pendingDecisionId ?? item.pending_decision) as unknown;
              let decided: number | undefined;
              if (typeof pdRaw === "number") decided = pdRaw as number;
              else if (typeof pdRaw === "string" && pdRaw.trim() !== "") decided = Number(pdRaw);
              else decided = undefined;
              const finalDecisionId = decided ?? (typeof item.id === "number" ? Number(item.id) : (typeof item.id === "string" && item.id ? Number(item.id) : 0));
              return { snapshot, decision_id: finalDecisionId } as PendingListItem;
            });
            setData(mapped);
            setLoading(false);
            return;
          }
        } catch (e) {
          // continue to use canonical response below
          console.debug("fallback snapshots load failed", e);
        }
      }

      setData(maybe as PendingListItem[]);
    } catch (e: unknown) {
      setError(errMsg(e) || "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  return { items: data ?? [], loading, error, refetch };
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
