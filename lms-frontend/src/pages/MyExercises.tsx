// src/pages/MyExercises.tsx
import React from "react"
import { listMyExercises, type Exercise } from "../services/exercises"
import { Link } from "react-router-dom"
import { Spinner } from "../components/ui/spinner"
import { Alert } from "../components/ui/alert"
import EmptyState from "../components/ui/empty-state"

export default function MyExercises() {
  const [items, setItems] = React.useState<Exercise[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<string>("")
  // paging is supported by the API but UI control not implemented yet
  const page = 1

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await listMyExercises({ page, page_size: 20, status: status || undefined })
      if (!mounted) return
      if (res.ok) setItems(res.data)
      else setError(`Impossibile caricare gli esercizi (HTTP ${res.status})`)
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [status])

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">I miei esercizi</h1>

      <div className="flex gap-2">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">Tutti gli stati</option>
          <option value="assigned">Assegnati</option>
          <option value="submitted">Inviati</option>
          <option value="under_review">In revisione</option>
          <option value="revision_requested">Revisione richiesta</option>
          <option value="approved">Approvati</option>
          <option value="rejected">Respinti</option>
        </select>
      </div>

      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Caricamento…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="Nessun esercizio trovato" description="Non ci sono esercizi corrispondenti al filtro selezionato." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-2">
          {items.map(e => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{e.title}</div>
                <div className="text-xs text-muted-foreground">
                  Stato: {e.status ?? "—"}{e.due_at ? ` • Scadenza: ${new Date(e.due_at).toLocaleString()}` : ""}
                </div>
              </div>
              <Link className="rounded-lg border px-3 py-1 text-sm hover:bg-accent" to={`/exercises/${e.id}/submit`}>
                {e.status === "assigned" || e.status === "revision_requested" ? "Invia" : "Apri"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
