// src/pages/studio/CourseBuilder.tsx
import React from "react"
import { Link, useParams } from "react-router-dom"
import {
  getCourseAdmin, listLessons, listExercises,
  createLesson, updateLesson,
  createExercise, updateExercise,
  type LessonAdmin, type ExerciseAdmin
} from "../../services/studio"
import { Spinner } from "../../components/ui/spinner"
import { Alert } from "../../components/ui/alert"
import EmptyState from "../../components/ui/empty-state"

export default function CourseBuilder() {
  const { id } = useParams<{ id: string }>()
  const courseId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [courseTitle, setCourseTitle] = React.useState<string>("Corso")

  const [lessons, setLessons] = React.useState<LessonAdmin[]>([])
  const [exByLesson, setExByLesson] = React.useState<Record<number, ExerciseAdmin[]>>({})

  // form add-lesson
  const [L_title, setLTitle] = React.useState("")
  const [L_desc, setLDesc] = React.useState("")
  const [L_duration, setLDuration] = React.useState<string>("")
  const [L_type, setLType] = React.useState<string>("theory")
  const [busyAddLesson, setBusyAddLesson] = React.useState(false)

  // form add-exercise per-lesson (stato locale per ogni lezione)
  const [exForms, setExForms] = React.useState<Record<number, { title: string; description: string; exercise_type: string; difficulty: string; time_estimate: string; materials: string; instructions: string; reference_image?: File | null }>>({})

  async function load() {
    setLoading(true)
    setError(null)

    // corso
    const c = await getCourseAdmin(courseId)
    if (!c.ok) {
      setError(`Impossibile caricare il corso (HTTP ${c.status}).`)
      setLoading(false)
      return
    }
    setCourseTitle(c.data.title || `Corso #${courseId}`)

    // lezioni
    const l = await listLessons(courseId)
    if (!l.ok) {
      setError(`Impossibile caricare le lezioni (HTTP ${l.status}).`)
      setLessons([])
      setLoading(false)
      return
    }
  const ls = l.data
    setLessons(ls)

    // esercizi per ogni lezione
    const map: Record<number, ExerciseAdmin[]> = {}
    for (const le of ls) {
      const er = await listExercises(le.id)
      map[le.id] = er.ok ? er.data : []
    }
    setExByLesson(map)

    setLoading(false)
  }

  React.useEffect(() => { if (Number.isFinite(courseId)) load() }, [courseId]) // eslint-disable-line

  async function onAddLesson(e: React.FormEvent) {
    e.preventDefault()
    setBusyAddLesson(true)
    const res = await createLesson(courseId, {
      title: L_title.trim(),
  description: L_desc.trim() || undefined,
  lesson_type: L_type,
  duration_min: L_duration ? Number(L_duration) : undefined,
      is_published: true,
    })
    setBusyAddLesson(false)
    if (!res.ok) {
      setError(`Creazione lezione fallita (HTTP ${res.status}).`)
      return
    }
  setLTitle(""); setLDesc(""); setLDuration("")
    await load()
  }

  async function onEditLesson(l: LessonAdmin, patch: Partial<LessonAdmin>) {
    const res = await updateLesson(l.id, {
      title: patch.title ?? l.title,
      description: patch.description ?? l.description ?? undefined,
      duration_min: patch.duration_min ?? l.duration_min ?? undefined,
      is_published: patch.is_published ?? l.is_published ?? undefined,
    })
    if (!res.ok) {
      setError(`Aggiornamento lezione fallito (HTTP ${res.status}).`)
      return
    }
    await load()
  }

  function updateExForm(lessonId: number, f: Partial<{ title: string; description: string; exercise_type: string; difficulty: string; time_estimate: string; materials: string; instructions: string; reference_image?: File | null }>) {
    setExForms(prev => ({
      ...prev,
      [lessonId]: {
        ...(prev[lessonId] || { title: "", description: "", exercise_type: "practical", difficulty: "beginner", time_estimate: "", materials: "", instructions: "", reference_image: null }),
        ...f,
      },
    }))
  }

  async function onAddExercise(e: React.FormEvent, lessonId: number) {
    e.preventDefault()
    const f = exForms[lessonId] || { title: "", description: "", exercise_type: "practical", difficulty: "beginner", time_estimate: "", materials: "", instructions: "", reference_image: null }
    if (!f.description || !f.description.trim()) {
      setError("La descrizione dell'esercizio è obbligatoria.")
      return
    }
    const res = await createExercise(lessonId, {
      title: f.title.trim(),
      description: f.description.trim(),
      exercise_type: f.exercise_type || "practical",
      difficulty: f.difficulty || "beginner",
      time_estimate: f.time_estimate ? Number(f.time_estimate) : undefined,
      materials: f.materials || undefined,
      instructions: f.instructions || undefined,
      reference_image: f.reference_image ?? undefined,
      course_id: courseId,
    }, courseId)
    if (!res.ok) {
      setError(`Creazione esercizio fallita (HTTP ${res.status}).`)
      return
    }
  updateExForm(lessonId, { title: "", description: "", exercise_type: "practical", difficulty: "beginner", time_estimate: "", materials: "", instructions: "", reference_image: null })
    await load()
  }

  async function onEditExercise(x: ExerciseAdmin, patch: Partial<ExerciseAdmin>) {
    const res = await updateExercise(x.id, {
      title: patch.title ?? x.title,
      description: patch.description ?? x.description ?? undefined,
      exercise_type: patch.exercise_type ?? x.exercise_type ?? undefined,
      difficulty: patch.difficulty ?? x.difficulty ?? undefined,
      time_estimate: patch.time_estimate ?? x.time_estimate ?? undefined,
      materials: patch.materials ?? x.materials ?? undefined,
      instructions: patch.instructions ?? x.instructions ?? undefined,
    })
    if (!res.ok) {
      setError(`Aggiornamento esercizio fallito (HTTP ${res.status}).`)
      return
    }
    await load()
  }

  if (!Number.isFinite(courseId)) return <div className="p-6">ID corso non valido.</div>

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm text-muted-foreground">
            <Link className="underline" to="/studio/courses">← Torna ai corsi</Link>
          </div>
          <h1 className="text-2xl font-semibold">Builder • {courseTitle}</h1>
        </div>
        <Link className="rounded-lg border px-3 py-2 text-sm hover:bg-accent" to={`/studio/courses/${courseId}/edit`}>Modifica corso</Link>
      </div>

      {loading && (
        <div className="flex items-center gap-3">
          <Spinner />
          <span className="text-sm text-muted-foreground">Caricamento…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}

      {/* Aggiungi lezione */}
      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-medium">Aggiungi lezione</h2>
        <form onSubmit={onAddLesson} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input className="h-9 rounded-md border px-3 sm:col-span-2" placeholder="Titolo lezione" value={L_title} onChange={(e) => setLTitle(e.target.value)} required />
          <select className="h-9 rounded-md border px-3" value={L_type} onChange={(e) => setLType(e.target.value)}>
            <option value="theory">Theory</option>
            <option value="practical">Practical</option>
            <option value="video">Video</option>
            <option value="mixed">Mixed</option>
          </select>
          <input className="h-9 rounded-md border px-3" placeholder="Durata (min)" type="number" min={0} value={L_duration} onChange={(e) => setLDuration(e.target.value)} />
          {/* Ordine assegnato automaticamente dal server; campo rimosso */}
          <textarea className="min-h-[80px] w-full rounded-md border p-3 sm:col-span-3" placeholder="Descrizione (opzionale)" value={L_desc} onChange={(e) => setLDesc(e.target.value)} />
          <button className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-50" disabled={busyAddLesson}>
            {busyAddLesson ? (
              <span className="inline-flex items-center">
                <Spinner size={16} className="mr-2" /> Aggiungo…
              </span>
            ) : (
              "Aggiungi lezione"
            )}
          </button>
        </form>
      </section>

      {/* Lezioni + Esercizi */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Lezioni</h2>
        {!loading && lessons.length === 0 && (
          <EmptyState title="Nessuna lezione" description="Non ci sono lezioni." />
        )}
        {lessons.map((l) => (
          <div key={l.id} className="rounded-xl border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3">
              <div>
                <div className="text-sm font-medium">{l.title}</div>
                <div className="text-xs text-muted-foreground">
                  Durata: {l.duration_min ?? "—"} min • Stato: {l.is_published ? "pubblicata" : "bozza"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                  onClick={() => onEditLesson(l, { is_published: !(l.is_published ?? false) })}
                >
                  {l.is_published ? "Metti in bozza" : "Pubblica"}
                </button>
                {/* Ordine gestito automaticamente dal server; controllo rimosso */}
              </div>
            </div>

            {/* Esercizi della lezione */}
            <div className="p-3 space-y-3">
              <div className="text-sm font-medium">Esercizi</div>
              {(exByLesson[l.id] ?? []).length === 0 && <div className="text-xs text-muted-foreground">Nessun esercizio.</div>}
              {(exByLesson[l.id] ?? []).map((x) => (
                <div key={x.id} className="flex items-center justify-between rounded-md border p-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm">{x.title}</div>
                      <div className="text-xs text-muted-foreground">
                        Tipo: {x.exercise_type ?? "—"} • Difficoltà: {x.difficulty ?? "—"} • Tempo stimato: {x.time_estimate ?? "—"} min
                      </div>
                  </div>
                  <button
                    className="rounded-md border px-3 py-1 text-sm hover:bg-accent"
                      onClick={() => onEditExercise(x, { })}
                  >
                      Modifica
                  </button>
                </div>
              ))}

              {/* Add exercise form */}
              <form onSubmit={(e) => onAddExercise(e, l.id)} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <input
                  className="h-9 rounded-md border px-3 sm:col-span-2"
                  placeholder="Titolo esercizio"
                  value={exForms[l.id]?.title || ""}
                  onChange={(e) => updateExForm(l.id, { title: e.target.value })}
                  required
                />
                  <select className="h-9 rounded-md border px-3" value={exForms[l.id]?.exercise_type || "practical"} onChange={(e) => updateExForm(l.id, { exercise_type: e.target.value })}>
                    <option value="practical">Practical</option>
                    <option value="study">Study</option>
                    <option value="technique">Technique</option>
                    <option value="creative">Creative</option>
                  </select>
                  <select className="h-9 rounded-md border px-3" value={exForms[l.id]?.difficulty || "beginner"} onChange={(e) => updateExForm(l.id, { difficulty: e.target.value })}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                  <input className="h-9 rounded-md border px-3" placeholder="Tempo stimato (min)" type="number" min={0} value={exForms[l.id]?.time_estimate || ""} onChange={(e) => updateExForm(l.id, { time_estimate: e.target.value })} />
                  <textarea className="min-h-[80px] w-full rounded-md border p-3 sm:col-span-3" placeholder="Descrizione" value={exForms[l.id]?.description || ""} onChange={(e) => updateExForm(l.id, { description: e.target.value })} required />
                  <textarea className="min-h-[80px] w-full rounded-md border p-3 sm:col-span-3" placeholder="Materials (opz.)" value={exForms[l.id]?.materials || ""} onChange={(e) => updateExForm(l.id, { materials: e.target.value })} />
                  <textarea className="min-h-[80px] w-full rounded-md border p-3 sm:col-span-3" placeholder="Instructions (opz.)" value={exForms[l.id]?.instructions || ""} onChange={(e) => updateExForm(l.id, { instructions: e.target.value })} />
                  <input className="h-9 rounded-md border px-3" type="file" onChange={(e) => updateExForm(l.id, { reference_image: e.target.files?.[0] ?? null })} />
                <button className="rounded-md border px-3 py-2 text-sm hover:bg-accent">Aggiungi esercizio</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
