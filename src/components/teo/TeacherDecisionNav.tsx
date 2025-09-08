import * as React from "react";
import { getTeacherChoicesPendingCount } from "@/services/notifications";
import { getPendingDiscountSnapshots } from "@/services/rewards";
import { useAuth } from "@/context/AuthContext";
import TeacherDecisionPanel from "./TeacherDecisionPanel";

export default function TeacherDecisionNav() {
  const { isAuthenticated, isTeacher, authChecked, role } = useAuth();
  const [count, setCount] = React.useState<number>(0);
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  type SnapshotUI = {
    id: number;
    course_title?: string | null;
    student_email?: string | null;
    offered_teacher_teo?: string | null;
    teacher_teo?: string | null;
    teo_cost_display?: string | null;
  pending_decision_id?: number | undefined;
  };
  const [pending, setPending] = React.useState<SnapshotUI[]>([]);

  function dedupeByDecisionId(items: SnapshotUI[]) {
    const seen = new Set<number>();
    const out: SnapshotUI[] = [];
    for (const it of items) {
      const key = it.pending_decision_id ?? -1;
      if (key > 0 && !seen.has(key)) {
        seen.add(key);
        out.push(it);
      }
    }
    return out.length ? out : items;
  }

  React.useEffect(() => {
    let mounted = true;
  // Avoid calling teacher-only endpoints until we have confirmed auth and the
  // role is explicitly 'teacher'. This prevents admins (or unresolved booting)
  // from triggering 403 responses on teacher-only APIs.
  if (!authChecked || !isAuthenticated || role !== 'teacher') {
      setCount(0);
      setPending([]);
      return;
    }

    // Initial fetch of pending count
    void (async () => {
      try {
        const c = await getTeacherChoicesPendingCount();
        if (!mounted) return;
        setCount(c);
      } catch {
        // ignore
      }
    })();

    // Update count when notifications elsewhere change (e.g. accept/decline, marking read)
    const onUpdated = () => {
      void (async () => {
        try {
          const c = await getTeacherChoicesPendingCount();
          if (!mounted) return;
          // If the count didn't change, try a best-effort fetch of pending snapshots
          if (typeof c === "number" && c === count) {
            try {
              const snaps = await getPendingDiscountSnapshots();
              if (!mounted) return;
              if (snaps && snaps.ok && Array.isArray(snaps.data)) {
                // dedupe by pending_decision_id
                const uniq = new Set<number>();
                for (const s of snaps.data as unknown as Record<string, unknown>[]) {
                  const pd = s["pending_decision_id"] as unknown;
                  if (typeof pd === "number" && pd > 0) uniq.add(pd);
                }
                // fallback: if no pending_decision_id present, count snapshots
                const fallbackCount = uniq.size > 0 ? uniq.size : (Array.isArray(snaps.data) ? (snaps.data as unknown[]).length : 0);
                setCount(fallbackCount);
                return;
              }
            } catch {
              // ignore snapshot errors
            }
          }
          setCount(c);
        } catch {
          // ignore
        }
      })();
    };

    window.addEventListener("notifications:updated", onUpdated as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener("notifications:updated", onUpdated as EventListener);
    };
  }, [isAuthenticated, isTeacher, authChecked, role, count]);

  async function openList() {
    if (!isAuthenticated || !isTeacher) return;
    try {
      // Prefer new rewards/pending snapshots endpoint which returns enriched snapshot data
      const res = await getPendingDiscountSnapshots();
      if (!res.ok) {
        setPending([]);
        setOpen(true);
        return;
      }
      const list = Array.isArray(res.data) ? (res.data as unknown[]) : [];
      // Map snapshot fields to expected UI shape
      const mapped = list.map((s) => {
        const item = s as Record<string, unknown>;
        return {
          id: Number(item.id) || 0,
          course_title: (item.course_title as string) ?? (item.course_title as string | undefined),
          student_email: (item.student_name as string) ?? undefined,
      offered_teacher_teo: (item.offered_teacher_teo as string) ?? (item.teacher_teo as string | undefined),
          teacher_teo: (item.teacher_teo as string) ?? undefined,
          teo_cost_display: (item.teacher_teo as string) ?? undefined,
      pending_decision_id: item.pending_decision_id ? Number(item.pending_decision_id) : undefined,
        } as SnapshotUI;
      });
        setPending(dedupeByDecisionId(mapped));
      setOpen(true);
    } catch {
      setPending([]);
      setOpen(true);
    }
  }

  // Only render for authenticated teachers
  if (!isAuthenticated || !isTeacher) return null;

  return (
    <div className="relative">
      <button
        onClick={() => void openList()}
        className="relative inline-flex items-center justify-center rounded-md px-3 py-2 border border-border bg-card text-card-foreground"
        title="Apri pannello decisioni TEO"
      >
        <span className="mr-1">🎁</span>
        <span className="hidden sm:inline">TEO Sconti</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 rounded-md border bg-background p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Decisioni in attesa</h4>
            <button className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>Chiudi</button>
          </div>
          <div className="mt-2 space-y-2 max-h-64 overflow-auto">
            {pending.length === 0 && <div className="text-sm text-muted-foreground">Nessuna in attesa</div>}
            {pending.map((it: SnapshotUI) => (
              <div key={it.id} className="flex items-center justify-between rounded border p-2">
                <div>
                  <div className="text-sm font-medium">{it.course_title ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{it.student_email ?? '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-sm">{it.offered_teacher_teo ?? it.teo_cost_display ?? '—'} TEO</div>
                  <button
                    className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-accent"
                    onClick={() => setSelectedId(it.pending_decision_id ?? it.id)}
                  >
                    Apri
                  </button>
                </div>
              </div>
            ))}
          </div>
          {selectedId != null && (
            <div className="mt-3">
              <TeacherDecisionPanel
                decisionId={selectedId}
                onClose={() => { setSelectedId(null); setOpen(false); }}
                onDecided={() => { setSelectedId(null); setOpen(false); /* refresh count/list */ void (async () => {
                  const c = await getTeacherChoicesPendingCount();
                  setCount(c);
                })(); }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
