// src/pages/ReviewsAssigned.tsx
import React from "react"
import { listAssignedReviews, type AssignedReview } from "../services/reviews"
import { Link } from "react-router-dom"
import { Alert } from "../components/ui/alert"
import { Spinner } from "../components/ui/spinner"
import EmptyState from "../components/ui/empty-state"

export default function ReviewsAssigned() {
  const [items, setItems] = React.useState<AssignedReview[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await listAssignedReviews()
      if (!mounted) return
  if (res.ok) setItems(res.data)
  else setError(`Impossibile caricare le revisioni assegnate (HTTP ${res.status})`)
  console.debug("[ReviewsAssigned] loaded items:", res)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Revisioni assegnate</h1>

      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Caricamento…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="Nessuna revisione assegnata" description="Non ci sono revisioni assegnate al momento." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={it.submission_id ?? it.exercise_id ?? idx} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {it.exercise_title ?? `Esercizio #${it.exercise_id}`}{it.submission_id ? ` • Sub #${it.submission_id}` : ''}
                </div>
                <div className="text-xs text-muted-foreground">
                  {it.student?.name ? `Studente: ${it.student.name}` : ""} {it.submitted_at ? `• Inviato: ${new Date(it.submitted_at).toLocaleString()}` : ""}
                </div>
              </div>
        { (it.submission_id && it.submission_id > 0) ? (
                <Link
                  to={`/reviews/${it.submission_id}/review`}
                  className="rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90"
                >
                  Apri review
                </Link>
              ) : it.exercise_id ? (
                <Link
                  to={`/reviews/${it.exercise_id}/review`}
                  className="rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:opacity-90"
                >
                  Apri review (da esercizio)
                </Link>
              ) : (
                <div className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-muted-foreground">N/D</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
