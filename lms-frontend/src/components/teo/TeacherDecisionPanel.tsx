// src/components/teo/TeacherDecisionPanel.tsx
import React from "react";
import { getTeacherChoice } from "@/services/notifications";
import { discountsApi } from "@/features/discounts/api";
import { backfillSnapshotsToDecisions, getPendingDiscountSnapshots } from "@/services/rewards";
import { showToast } from "@/lib/api";

type Props = {
  decisionId?: number | null;
  onClose?: () => void;
  onDecided?: (decision: "accepted" | "declined") => void;
};

type DecisionDetail = {
  id: number;
  student_email?: string;
  course_title?: string;
  course_price?: string | number;
  discount_percentage?: number;
  teacher_commission_rate?: string | number;
  teacher_staking_tier?: string;
  teo_cost_display?: string | number;
  teacher_bonus_display?: string | number;
  discounted_price?: string | number;
  decision?: "pending" | "accepted" | "declined" | string;
  teacher_earnings_if_accepted?: { fiat?: string | number; teo?: string | number; total_teo?: string | number };
  teacher_earnings_if_declined?: { fiat?: string | number; teo?: string | number; total_teo?: string | number };
  offered_teacher_teo?: string | number | null;
  final_teacher_teo?: string | number | null;
  is_expired?: boolean;
  time_remaining?: string;
};

export default function TeacherDecisionPanel({ decisionId, onClose, onDecided }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<DecisionDetail | null>(null);
  const [acting, setActing] = React.useState<"accept" | "decline" | null>(null);

  const load = React.useCallback(async () => {
    if (!decisionId && decisionId !== 0) return;
    setLoading(true);
    setError(null);
    const res = await getTeacherChoice(decisionId as number);
    setLoading(false);
    if (!res.ok) {
      // If the decision record is missing (404), attempt a best-effort backfill from the snapshot id
      if (res.status === 404) {
        try {
          setLoading(true);
          // Attempt to create TeacherDiscountDecision(s) from snapshot(s)
          const backfill = await backfillSnapshotsToDecisions([decisionId as number]);
          if (!backfill.ok) {
            setError("Impossibile ricreare la decisione dal snapshot.");
            setDetail(null);
            setLoading(false);
            return;
          }
          // Re-fetch pending snapshots to find the new decision id
          const pending = await getPendingDiscountSnapshots();
          setLoading(false);
          if (!pending.ok || !Array.isArray(pending.data)) {
            setError("Ripristino completato ma impossibile recuperare gli snapshot in attesa.");
            setDetail(null);
            return;
          }
          const found = (pending.data as unknown[]).find((s) => {
            try {
              const item = s as Record<string, unknown>;
              const id = item.id;
              return Number(id) === Number(decisionId);
            } catch {
              return false;
            }
          }) as unknown as Record<string, unknown> | undefined;
          const newDecisionId = found ? (found["pending_decision_id"] as unknown) : undefined;
          if (newDecisionId && Number(newDecisionId) > 0) {
            // Retry loading using the freshly-created decision id
            setLoading(true);
            const retry = await getTeacherChoice(Number(newDecisionId));
            setLoading(false);
            if (retry.ok) {
              setDetail((retry.data as unknown as DecisionDetail) ?? null);
              return;
            }
            setError("Ripristino riuscito ma impossibile caricare la decisione creata.");
            setDetail(null);
            return;
          }
          setError("Ripristino eseguito ma non è stata trovata alcuna decisione associata allo snapshot.");
          setDetail(null);
          return;
        } catch (e) {
          console.warn("backfill error", e);
          setError("Errore durante il ripristino della decisione dal snapshot.");
          setDetail(null);
          setLoading(false);
          return;
        }
      }
      setDetail(null);
      return;
    }
    const loadedDetail = (res.data as unknown as DecisionDetail) ?? null;
    setDetail(loadedDetail);

    // Fallback: if the serializer didn't include offered_teacher_teo for a
    // pending decision, try to fetch it from pending snapshots (best-effort).
    try {
      const isPending = loadedDetail && String(loadedDetail.decision ?? "").toLowerCase().trim() === "pending";
      const missingOffered = loadedDetail && (loadedDetail.offered_teacher_teo === null || typeof loadedDetail.offered_teacher_teo === "undefined");
      if (isPending && missingOffered) {
        const snaps = await getPendingDiscountSnapshots();
        if (snaps && snaps.ok && Array.isArray(snaps.data)) {
          const found = (snaps.data as unknown[]).find((s) => {
            try {
              const item = s as Record<string, unknown>;
              const pdid = item["pending_decision_id"];
              return Number(pdid) === Number(decisionId);
            } catch {
              return false;
            }
          }) as unknown as Record<string, unknown> | undefined;
          if (found && found["offered_teacher_teo"]) {
            setDetail((prev) => (prev ? ({ ...prev, offered_teacher_teo: String(found["offered_teacher_teo"]) }) : prev));
          }
        }
      }
    } catch (e) {
      console.debug("pending snapshots fallback failed", e);
    }
  }, [decisionId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const displayTeo = React.useMemo(() => {
    if (!detail) return null;
  const decisionNorm = String(detail.decision ?? "").toLowerCase().trim();
  // pending: prefer offered from snapshot/serializer
  if (decisionNorm === "pending") {
      const d = detail as unknown as Record<string, unknown>;
  // Fonte unica: offered_teacher_teo (snapshot/serializer)
  return (d["offered_teacher_teo"] as string | number | null) ?? detail.teo_cost_display ?? null;
    }
    // accepted: prefer final accepted value
  if (decisionNorm === "accepted") {
      const d = detail as unknown as Record<string, unknown>;
  // Fonte unica: final_teacher_teo
  return (d["final_teacher_teo"] as string | number | null) ?? null;
    }
    return null;
  }, [detail]);

  const decisionNorm = detail ? String(detail.decision ?? "").toLowerCase().trim() : "";
  const disabled = !detail || decisionNorm !== "pending" || Boolean(detail.is_expired);

  async function makeDecision(kind: "accept" | "decline") {
    if (!decisionId && decisionId !== 0) return;
    setActing(kind);
  // Use new discountsApi endpoints (legacy compat routes are mounted in backend)
  type SimpleRes = { ok: boolean; status?: number; error?: unknown; data?: unknown };
  let res: SimpleRes = { ok: false };
    try {
      if (kind === "accept") {
        const data = await discountsApi.acceptDecision(decisionId as number);
        res = { ok: true, status: 200, data };
      } else {
        const data = await discountsApi.declineDecision(decisionId as number);
        res = { ok: true, status: 200, data };
      }
    } catch (e: unknown) {
      // discountsApi throws for non-ok responses; normalize shape expected by component
      const errObj = e as Record<string, unknown> | undefined;
      const statusVal = errObj && typeof errObj["status"] === "number" ? (errObj["status"] as number) : 500;
      const errorMsg = errObj && (errObj["error"] ?? errObj["message"]) ? String(errObj["error"] ?? errObj["message"]) : String(e);
      res = { ok: false, status: statusVal, error: errorMsg };
    }

    setActing(null);
    if (!res.ok) {
      const errObj = (res as unknown as { error?: { error?: string; detail?: string } }).error;
      const msg = errObj?.error || errObj?.detail || `Operazione fallita (${res.status})`;
      try { showToast({ variant: "error", message: String(msg) }); } catch (e) { console.debug("toast error", e); }
      // Refresh to reflect possible state changes
      await load();
      return;
    }

    try { showToast({ variant: "success", message: kind === "accept" ? "Richiesta accettata" : "Richiesta rifiutata" }); } catch (e) { console.debug("toast error", e); }
    // Refresh detail to pick up server-side final_teacher_teo / state changes
    await load();
  // Notify outer UI (close panel, refresh lists/badges, refresh wallet)
  try { window.dispatchEvent(new CustomEvent("notifications:updated")); } catch (e) { console.debug("dispatch error", e); }
  try { window.dispatchEvent(new CustomEvent("wallet:updated")); } catch (e) { console.debug("dispatch error", e); }
    if (onDecided) onDecided(kind === "accept" ? "accepted" : "declined");
    if (onClose) onClose();
  }

  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-lg font-medium">Decisione sconto TeoCoin</h3>
        {decisionId != null && <p className="text-xs text-muted-foreground">Decision ID: {decisionId}</p>}
      </header>

      {loading && <p className="text-sm">Caricamento…</p>}
      {error && (
        <div className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {detail && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-muted-foreground">Corso</div>
              <div className="font-medium">{detail.course_title ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Studente</div>
              <div className="font-medium">{detail.student_email ?? "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Prezzo</div>
              <div className="font-mono">€ {String(detail.course_price ?? "—")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sconto</div>
              <div className="font-mono">{String(detail.discount_percentage ?? "—")}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Commissione teacher</div>
              <div className="font-mono">{String(detail.teacher_commission_rate ?? "—")}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Tier staking</div>
              <div className="font-mono">{String(detail.teacher_staking_tier ?? "—")}</div>
            </div>
          </div>

          <div className="mt-2 rounded-md border p-2">
            <div className="text-sm font-medium">TEO offerti</div>
            <div className="text-sm text-muted-foreground">Student + bonus teacher</div>
            <div className="font-mono">{displayTeo != null ? `${String(displayTeo)} TEO` : "—"}</div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-md border p-2">
              <div className="font-medium">Se accetti</div>
              <div>Fiat: € {String(detail?.teacher_earnings_if_accepted?.fiat ?? "—")}</div>
              <div>TEO: {displayTeo != null ? String(displayTeo) : String(detail?.teacher_earnings_if_accepted?.teo ?? "—")}</div>
            </div>
            <div className="rounded-md border p-2">
              <div className="font-medium">Se rifiuti</div>
              <div>Fiat: € {String(detail?.teacher_earnings_if_declined?.fiat ?? "—")}</div>
              <div>TEO: {String(detail?.teacher_earnings_if_declined?.teo ?? "—")}</div>
            </div>
          </div>

          {detail.decision !== "pending" && (
            <div className="rounded border bg-muted p-2 text-sm">
              Decisione attuale: <span className="font-medium">{String(detail.decision)}</span>
            </div>
          )}
          {detail.is_expired && (
            <div className="rounded border border-yellow-300 bg-yellow-50 p-2 text-sm text-yellow-900">
              Scaduta. Non puoi più decidere.
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => (onClose ? onClose() : undefined)}
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-accent"
        >
          Chiudi
        </button>
        <button
          onClick={() => void makeDecision("decline")}
          disabled={disabled || acting !== null}
          className="inline-flex h-9 items-center rounded-md bg-red-600 px-3 text-sm text-white hover:opacity-90 disabled:opacity-50"
          title={disabled ? "Non disponibile" : undefined}
        >
          {acting === "decline" ? "Rifiuto…" : "Rifiuta"}
        </button>
        <button
          onClick={() => void makeDecision("accept")}
          disabled={disabled || acting !== null}
          className="inline-flex h-9 items-center rounded-md bg-green-600 px-3 text-sm text-white hover:opacity-90 disabled:opacity-50"
          title={disabled ? "Non disponibile" : undefined}
        >
          {acting === "accept" ? "Accetto…" : "Accetta"}
        </button>
      </div>
    </div>
  );
}
