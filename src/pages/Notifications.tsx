// src/pages/Notifications.tsx
import React from "react";
import NotificationItem from "../components/NotificationItem";
import { Alert } from "../components/ui/alert";
import { Spinner } from "../components/ui/spinner";
import EmptyState from "../components/ui/empty-state";
// Local notification shape used in the UI
type N = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  read?: boolean;
  created_at?: string | null;
  notification_type?: string;
  decision_id?: number | null;
  related_object_id?: number | null;
  offered_teacher_teo?: string | null;
};
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  notifyUpdated,
} from "../services/notifications";
import { deleteNotification, clearAllNotifications } from "../services/notifications";
import TeacherDecisionPanel from "../components/teo/TeacherDecisionPanel";
import DrfPager from "../components/DrfPager";

export default function Notifications() {
  const [items, setItems] = React.useState<N[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [count, setCount] = React.useState<number | undefined>(undefined);
  const [selectedDecisionId, setSelectedDecisionId] = React.useState<number | null>(null);
  const pageRef = React.useRef(page);
  React.useEffect(() => { pageRef.current = page; }, [page]);
  // Backfill via rewards missing-for-teacher is deprecated; rely solely on notifications feed

  async function load(p = page) {
    setLoading(true);
    setError(null);
    const res = await getNotifications({ page: p, page_size: pageSize });
    if (!res.ok) {
      setError(`Impossibile caricare le notifiche (status ${res.status}).`);
      setItems([]);
      setCount(undefined);
    } else {
  // Backend guarantees `decision_id` and `discount_eur`; do not infer decision_id from related_object_id.
  const mapped = res.data as Record<string, unknown>[];
      console.debug("[Notifications] loaded", { count: mapped.length, sample: mapped[0] });
      setItems(mapped as N[]);
      setCount(res.count);
    }
    setLoading(false);
  }

  React.useEffect(() => {
    load(1);
    // Stable listener across mounts; uses pageRef to get latest page
    const onUpdated = () => load(pageRef.current);
    window.addEventListener("notifications:updated", onUpdated as EventListener);
    return () => {
      window.removeEventListener("notifications:updated", onUpdated as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onMarkRead(id: N["id"]) {
    // Optimistic update: mark locally immediately
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, read: true } : it)));
    setMutating(true);
    try {
      const r = await markNotificationRead(id);
      if (!r.ok) {
        // Revert if failed
        await load(page);
        console.warn("mark read failed", r.status, r.error);
      } else {
        // ensure global listeners update
        notifyUpdated();
      }
    } finally {
      setMutating(false);
    }
  }

  async function onMarkAll() {
    setMutating(true);
    try {
      const r = await markAllNotificationsRead();
      if (r.ok) {
        // Optimistic: set all items read locally
        setItems((prev) => prev.map((it) => ({ ...it, read: true })));
        notifyUpdated();
        // refresh to get server truth
        await load(page);
      } else {
        console.warn("mark all failed", r.status, r.error);
      }
    } finally {
      setMutating(false);
    }
  }

  async function onDelete(id: N["id"]) {
    // Optimistic remove
    const prev = items;
    setItems((p) => p.filter((it) => it.id !== id));
    setMutating(true);
    try {
      const r = await deleteNotification(id);
      if (!r.ok) {
        // revert
        setItems(prev);
        console.warn("delete failed", r.status, r.error);
      } else {
        notifyUpdated();
      }
    } finally {
      setMutating(false);
    }
  }

  async function onClearAll() {
    if (!confirm("Sei sicuro di eliminare tutte le notifiche?")) return;
    setMutating(true);
    try {
      const r = await clearAllNotifications();
      if (r.ok) {
        setItems([]);
        notifyUpdated();
      } else {
        console.warn("clear all failed", r.status, r.error);
      }
    } finally {
      setMutating(false);
    }
  }

  function toPage(p: number) {
    const nx = Math.max(1, p);
    setPage(nx);
    load(nx);
  }

  // Collapse pending + urgent notifications by decision_id so teacher sees one row per decision
  const collapsedItems = React.useMemo(() => {
    // Group notifications that are of types teocoin_discount_pending or teocoin_discount_pending_urgent by decision_id
    const byDecision = new Map<number | string, N[]>();
    const others: N[] = [];
    for (const it of items) {
      const isDiscount = it.notification_type === "teocoin_discount_pending" || it.notification_type === "teocoin_discount_pending_urgent";
      // Use decision_id only; do not infer from related_object_id.
      const key = it.decision_id ?? null;
      if (isDiscount && key != null) {
        const arr = byDecision.get(key) ?? [];
        arr.push(it);
        byDecision.set(key, arr);
      } else {
        others.push(it);
      }
    }
    const merged: N[] = [];
    // For each grouped decision, prefer the most recent item and mark urgent if present
  for (const arr of byDecision.values()) {
      // pick most recent by created_at
      const sorted = arr.slice().sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      const primary = { ...sorted[0] } as N & { is_urgent?: boolean };
      // if any item is urgent, set flag
      if (arr.some((x) => x.notification_type === "teocoin_discount_pending_urgent")) {
        primary.is_urgent = true;
      }
      merged.push(primary);
    }
    // Append non-discount notifications afterwards preserving order
    return [...merged, ...others];
  }, [items]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Notifiche</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(page)}
            className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent"
            disabled={loading}
          >
            {loading ? "Aggiorno..." : "Ricarica"}
          </button>
          <button
            onClick={onMarkAll}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-primary-foreground hover:opacity-90"
            disabled={loading || mutating || items.length === 0}
          >
            Segna tutte come lette
          </button>
          <button
            onClick={onClearAll}
            className="inline-flex h-9 items-center rounded-md border px-3 hover:bg-accent"
            disabled={loading || mutating || items.length === 0}
          >
            Svuota tutte
          </button>
        </div>
      </header>

      {error && <Alert variant="error" title="Errore">{error}</Alert>}
      {loading && !items.length && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-sm text-muted-foreground">Caricamento in corso…</span>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <EmptyState title="Nessuna notifica" description="Non hai ancora ricevuto notifiche." />
      )}

      <div className="space-y-3">
        {collapsedItems.map((it) => (
          <div key={it.id}>
            <NotificationItem item={it} onMarkRead={onMarkRead} onDelete={onDelete} />
            {/* If this notification references a decision, show the open-decision button. Use decision_id directly. */}
            {(it.decision_id as number) && (
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = (it.decision_id as number) ?? null;
                    if (id) setSelectedDecisionId(Number(id));
                  }}
                  className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-accent"
                >
                  Apri decisione
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <DrfPager
        page={page}
        count={count}
        pageSize={pageSize}
        onPageChange={toPage}
        className="pt-4"
      />

      {selectedDecisionId != null && (
        <div className="mt-4">
          <TeacherDecisionPanel
            decisionId={selectedDecisionId}
            onClose={() => setSelectedDecisionId(null)}
            onDecided={async () => {
              setSelectedDecisionId(null);
              notifyUpdated();
              await load(page);
            }}
          />
        </div>
      )}
    </section>
  );
}
