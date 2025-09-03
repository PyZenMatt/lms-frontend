// src/pages/studio/CoursesStudioList.tsx
import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { listTeachingCourses, type CourseAdmin } from "../../services/studio"
import { Spinner } from "../../components/ui/spinner"
import { Alert } from "../../components/ui/alert"
import EmptyState from "../../components/ui/empty-state"

export default function CoursesStudioList() {
  const nav = useNavigate()
  const [items, setItems] = React.useState<CourseAdmin[]>([])
  const [count, setCount] = React.useState<number | undefined>(undefined)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")

  async function load() {
    setLoading(true)
    setError(null)
  // Prefer teacher-scoped endpoint so we list courses for the logged user (draft + published)
  const res = await listTeachingCourses({ page: 1, page_size: 50, search: search || undefined, mine: 1 })
    if (!res.ok) {
      setError(`Impossibile caricare i tuoi corsi (HTTP ${res.status}).`)
      setItems([])
      setCount(undefined)
      setLoading(false)
      return
    }
    setItems(res.data.items)
    setCount(res.data.count)
    setLoading(false)
  }

  React.useEffect(() => { load() }, []) // eslint-disable-line

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">I miei corsi</h1>
          <p className="text-sm text-muted-foreground">Crea e gestisci i tuoi corsi, le lezioni e gli esercizi.</p>
        </div>
        <button
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90"
          onClick={() => nav("/studio/courses/new")}
        >
          + Nuovo corso
        </button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); load() }}
        className="flex items-center gap-2"
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca corso…"
          className="h-9 rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-primary"
        />
        <button className="h-9 rounded-md border px-3" disabled={loading}>Cerca</button>
      </form>

      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Caricamento…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}

      {!loading && !error && items.length === 0 && (
        <EmptyState title="Ancora nessun corso" description="Crea o importa un corso per cominciare." />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="text-left text-sm">
              <tr className="text-muted-foreground">
                <th className="py-2 pr-4">Titolo</th>
                <th className="py-2 pr-4">Prezzo</th>
                <th className="py-2 pr-4">Stato</th>
                <th className="py-2 pr-4">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(c => (
                <tr key={c.id} className="text-sm">
                  <td className="py-2 pr-4">{c.title}</td>
                  <td className="py-2 pr-4">{typeof c.price === "number" ? new Intl.NumberFormat("it-IT", { style: "currency", currency: c.currency ?? "EUR" }).format(c.price) : "—"}</td>
                  <td className="py-2 pr-4">{c.status ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Link className="rounded-md border px-3 py-1 hover:bg-accent" to={`/studio/courses/${c.id}/edit`}>Modifica</Link>
                      <Link className="rounded-md border px-3 py-1 hover:bg-accent" to={`/studio/courses/${c.id}/builder`}>Builder</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {typeof count === "number" && <div className="mt-2 text-xs text-muted-foreground">Totale: {count}</div>}
        </div>
      )}
    </div>
  )
}
