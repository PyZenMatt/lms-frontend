// src/pages/ExerciseSubmit.tsx
import React from "react"
import { useParams } from "react-router-dom"
import { getExercise } from "../services/exercises"
import { Alert } from "../components/ui/alert"
import { Spinner } from "../components/ui/spinner"

export default function ExerciseSubmit() {
  const { id } = useParams<{ id: string }>()
  const exerciseId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>("")
  const [description, setDescription] = React.useState<string>("—")
  const [status, setStatus] = React.useState<string>("")

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await getExercise(exerciseId)
      if (!mounted) return
      if (!res.ok) {
        setError(`Impossibile caricare l'esercizio (HTTP ${res.status})`)
      } else {
        setTitle(res.data.title ?? `Esercizio #${exerciseId}`)
        setDescription(res.data.description || "—")
        setStatus(res.data.status ?? "")
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [exerciseId])

  // No submission allowed: this page only shows instructions.

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{title}</h1>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-sm text-muted-foreground">Caricamento in corso…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}
      {/* No submission UI — only instructions */}

      {!loading && !error && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-card">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</div>
            <div className="mt-2 text-xs text-muted-foreground">Stato corrente: <b>{status || "—"}</b></div>
          </div>
        </>
      )}
    </div>
  )
}
