// src/pages/ReviewsHistory.tsx
import React from "react"
import { listReviewsHistory } from "../services/reviews"
import { Alert } from "../components/ui/alert"
import { Spinner } from "../components/ui/spinner"
import EmptyState from "../components/ui/empty-state"

type ReviewItem = {
  exercise_title?: string | null;
  exercise_id?: number | string;
  decision?: string | null;
  status?: string | null;
  score?: number | null;
  created_at?: string | null;
  comment?: string | null;
};

export default function ReviewsHistory() {
  const [items, setItems] = React.useState<ReviewItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await listReviewsHistory()
      if (!mounted) return
      if (res.ok) setItems(res.data)
      else setError(`Impossibile caricare lo storico (HTTP ${res.status})`)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Storico revisioni</h1>

      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Caricamento…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="Nessuna review in storico" description="Non ci sono revisioni da mostrare." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">Esercizio: {it.exercise_title ?? it.exercise_id ?? "—"}</div>
              <div className="text-xs text-muted-foreground">
                Esito: {it.decision ?? it.status ?? "—"}
                {typeof it.score === "number" ? ` • Punteggio: ${it.score}` : ""}
                {it.created_at ? ` • ${new Date(it.created_at).toLocaleString()}` : ""}
              </div>
              {it.comment && <div className="mt-1 whitespace-pre-wrap">{it.comment}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
