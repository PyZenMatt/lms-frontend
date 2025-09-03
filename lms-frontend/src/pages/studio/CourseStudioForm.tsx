// src/pages/studio/CourseStudioForm.tsx
import React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { createCourse, getCourseAdmin, updateCourse, type CourseInput, CATEGORY_OPTIONS } from "../../services/studio"
import { Spinner } from "../../components/ui/spinner"
import { Alert } from "../../components/ui/alert"
// EmptyState not required here

export default function CourseStudioForm() {
  const { id } = useParams<{ id: string }>()
  const editing = !!id
  const courseId = editing ? Number(id) : undefined
  const nav = useNavigate()

  const [loading, setLoading] = React.useState(editing)
  const [error, setError] = React.useState<string | null>(null)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [price, setPrice] = React.useState<string>("")
  const [currency, setCurrency] = React.useState("EUR")
  const [status, setStatus] = React.useState<"draft" | "published">("draft")
  const [category, setCategory] = React.useState<string>("")
  const [coverUrl, setCoverUrl] = React.useState<string>("")
  const [coverFile, setCoverFile] = React.useState<File | undefined>(undefined)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      if (!editing || !courseId) return
      setLoading(true)
      setError(null)
      const res = await getCourseAdmin(courseId)
      if (!mounted) return
      if (!res.ok) setError(`Impossibile caricare il corso (HTTP ${res.status}).`)
      else {
        setTitle(res.data.title || "")
        setDescription(res.data.description || "")
        setPrice(typeof res.data.price === "number" ? String(res.data.price) : "")
        setCurrency(res.data.currency || "EUR")
        // coerce status safely
        const s = typeof res.data.status === "string" ? res.data.status : String(res.data.status ?? "draft")
        setStatus(s === "published" ? "published" : "draft")
        setCategory(res.data.category ? String(res.data.category) : "")
        setCoverUrl(res.data.cover_url || "")
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [editing, courseId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body: CourseInput = {
      title: title.trim(),
      description: description.trim(),
      price: price ? Number(price) : null,
      currency,
      status,
      category: category ? (Number.isFinite(Number(category)) ? Number(category) : category) : null,
      cover_url: coverUrl || undefined,
      cover_file: coverFile,
    }
    const res = editing && courseId
      ? await updateCourse(courseId, body)
      : await createCourse(body)
    setBusy(false)
    if (!res.ok) {
      setError(`Salvataggio non riuscito (HTTP ${res.status}). Controlla i campi.`)
      return
    }
    nav(`/studio/courses/${res.data.id}/builder`)
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">{editing ? "Modifica corso" : "Nuovo corso"}</h1>
      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <div className="text-sm text-muted-foreground">Caricamento…</div>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}
      {!loading && (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Titolo</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 w-full rounded-md border px-3" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Descrizione</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px] w-full rounded-md border p-3" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Prezzo</label>
              <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="h-9 w-full rounded-md border px-3" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Valuta</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9 w-full rounded-md border px-2">
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Stato</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")} className="h-9 w-full rounded-md border px-2">
                <option value="draft">Bozza</option>
                <option value="published">Pubblicato</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Categoria</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full rounded-md border px-3">
                <option value="">Seleziona categoria</option>
                {CATEGORY_OPTIONS.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cover URL (opzionale)</label>
              <input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} className="h-9 w-full rounded-md border px-3" placeholder="https://…" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Oppure carica cover (file)</label>
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0])} />
          </div>

          <div className="pt-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50" disabled={busy}>
              {busy ? "Salvataggio…" : "Salva e prosegui"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
