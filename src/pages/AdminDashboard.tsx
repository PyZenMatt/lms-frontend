// src/pages/AdminDashboard.tsx
import React from "react";
import {
  listPendingTeachers,
  approveTeacher,
  rejectTeacher,
} from "../services/admin";

// local, minimal PendingTeacher shape used by this page (avoid relying on export)
type PendingTeacher = {
  id: number | string;
  username?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  applied_at?: string | null;
  created_at?: string | null;
};
import { Spinner } from "../components/ui/spinner";
import { Alert } from "../components/ui/alert";
import EmptyState from "../components/ui/empty-state";

function prettyName(u: PendingTeacher) {
  const full = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
  return full || u.username || u.email || String(u.id);
}

export default function AdminDashboard() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<PendingTeacher[]>([]);
  const [count, setCount] = React.useState<number>(0);
  const [busy, setBusy] = React.useState<Record<string | number, "approve" | "reject" | "">>({});

  // query state
  const [page, setPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(20);
  const [search, setSearch] = React.useState<string>("");
  const [appliedSearch, setAppliedSearch] = React.useState<string>("");

  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listPendingTeachers({
        page,
        page_size: pageSize,
        q: appliedSearch || undefined,
      });
      // api.get returns { ok, status, data, error } - data should contain { items, count }
      const payload = res?.data as any;
      const safeItems: PendingTeacher[] = Array.isArray(payload?.items) ? payload.items : [];
      setItems(safeItems);
      setCount(typeof payload?.count === "number" ? payload.count : safeItems.length);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || "Errore inatteso");
    } finally {
      setLoading(false);
    }
  }
  // load is stable in this component; intentionally exclude it from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { load(); }, [page, pageSize, appliedSearch]);

  function applySearch() {
    setPage(1);
    setAppliedSearch(search.trim());
  }

  async function onApprove(id: number | string) {
  setBusy((b) => ({ ...b, [id]: "approve" as const }));
    try {
      // approveTeacher is a wrapper for approveCourse and expects a number; coerce if needed
      await approveTeacher(Number(id));
      // ricarica la pagina corrente (se svuotata e non prima, scala pagina)
      const after = Math.max(1, Math.min(page, Math.ceil((count - 1) / pageSize) || 1));
      if (after !== page) setPage(after);
      else await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || "Errore approvazione");
    } finally {
      setBusy((b) => ({ ...b, [id]: "" as const }));
    }
  }

  async function onReject(id: number | string) {
  setBusy((b) => ({ ...b, [id]: "reject" as const }));
    try {
      await rejectTeacher(id);
      const after = Math.max(1, Math.min(page, Math.ceil((count - 1) / pageSize) || 1));
      if (after !== page) setPage(after);
      else await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg || "Errore rifiuto");
    } finally {
      setBusy((b) => ({ ...b, [id]: "" as const }));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin — Docenti in attesa</h1>
          <p className="text-sm text-muted-foreground">Approva o rifiuta le richieste dei docenti.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Page size</label>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="h-9 rounded-md border bg-background px-2"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              placeholder="Cerca email o username…"
              className="h-9 w-56 rounded-md border bg-background px-3"
            />
            <button
              onClick={applySearch}
              className="h-9 rounded-md border border-input bg-background px-3 hover:bg-accent"
            >
              Cerca
            </button>
          </div>

          <button
            onClick={() => load()}
            className="h-9 rounded-md border border-input bg-background px-3 hover:bg-accent"
          >
            Ricarica
          </button>
        </div>
      </header>

      <section className="rounded-lg border border-border bg-card text-card-foreground">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-base font-semibold">Docenti in attesa</h2>
          <span className="text-sm text-muted-foreground">
            {loading ? (
                <span className="inline-flex items-center gap-3"><Spinner /> Caricamento…</span>
              ) : `${(items || []).length} visibili / ${count} totali`}
          </span>
        </div>

  {error && <Alert variant="error">{error}</Alert>}

  {loading ? (
          <div className="p-4 text-sm text-muted-foreground"><Spinner /> Caricamento…</div>
  ) : (items || []).length === 0 ? (
          <EmptyState title="Nessun docente in attesa" description={appliedSearch ? `Nessun docente in attesa per “${appliedSearch}”` : "Nessun docente in attesa."} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="[&>th]:px-4 [&>th]:py-2 text-left">
                    <th>Utente</th>
                    <th className="hidden sm:table-cell">Email</th>
                    <th className="hidden lg:table-cell">Richiesta</th>
                    <th className="w-56 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {(items || []).map((u) => {
                    const name = prettyName(u);
                    const busyState = busy[u.id] || "";
                    const isApproving = busyState === "approve";
                    const isRejecting = busyState === "reject";
                    return (
                      <tr key={u.id} className="border-t border-border [&>td]:px-4 [&>td]:py-2">
                        <td>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {u.email || u.username || "—"}
                          </div>
                        </td>
                        <td className="hidden sm:table-cell">{u.email || "—"}</td>
                        <td className="hidden lg:table-cell">
                          <span className="text-muted-foreground">{u.applied_at || u.created_at || "—"}</span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => onApprove(u.id)}
                              disabled={isApproving || isRejecting}
                              className="h-9 px-3 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                              title="Approva docente"
                            >
                              {isApproving ? "Approvando…" : "Approva"}
                            </button>
                            <button
                              onClick={() => onReject(u.id)}
                              disabled={isApproving || isRejecting}
                              className="h-9 px-3 rounded-md border border-input bg-background hover:bg-accent disabled:opacity-50"
                              title="Rifiuta docente"
                            >
                              {isRejecting ? "Rifiutando…" : "Rifiuta"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pager */}
            <div className="flex items-center justify-between border-t border-border p-4 text-sm">
              <div className="text-muted-foreground">
                Pagina <span className="font-medium">{page}</span> di <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))}
                  disabled={!canPrev}
                  className="h-9 rounded-md border border-input bg-background px-3 hover:bg-accent disabled:opacity-50"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => canNext && setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!canNext}
                  className="h-9 rounded-md border border-input bg-background px-3 hover:bg-accent disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
