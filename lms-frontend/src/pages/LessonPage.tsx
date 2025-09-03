// src/pages/LessonPage.tsx
import React from "react"
import { Link, useParams } from "react-router-dom"
import { getLessonData, markLessonComplete, type Exercise } from "../services/lessons"
import { Spinner } from "../components/ui/spinner"
import { Alert } from "../components/ui/alert"
import EmptyState from "../components/ui/empty-state"

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const lessonId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>("Lezione")
  const [description, setDescription] = React.useState<string>("—")
  const [isCompleted, setIsCompleted] = React.useState<boolean>(false)
  const [courseId, setCourseId] = React.useState<number | undefined>(undefined)
  const [exercises, setExercises] = React.useState<Exercise[]>([])
  const [toggling, setToggling] = React.useState(false)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await getLessonData(lessonId)
      if (!mounted) return
      if (!res.ok) {
        setError(`Impossibile caricare la lezione (HTTP ${res.status})`)
      } else {
        setTitle(res.data.lesson.title || `Lezione #${lessonId}`)
        setDescription(res.data.lesson.description || "—")
        setIsCompleted(!!res.data.lesson.is_completed)
        setCourseId(res.data.lesson.course_id)
        setExercises(res.data.exercises)
      }
      setLoading(false)
    }
    if (Number.isFinite(lessonId)) load()
    return () => { mounted = false }
  }, [lessonId])

  async function onToggleComplete() {
    setToggling(true)
    const res = await markLessonComplete(lessonId)
    setToggling(false)
    if (!res.ok) {
      setError(`Non sono riuscito a segnare la lezione come completata (HTTP ${res.status}).`)
      return
    }
    // Immediately mark completed locally and notify other views so the course page
    // updates without waiting for the follow-up fetch.
    setIsCompleted(true)
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") {
      // ensure numeric courseId if available
      const dispatchCourseId = typeof courseId !== "undefined" ? Number(courseId) : undefined
      window.dispatchEvent(new CustomEvent("lesson:completed", { detail: { lessonId, courseId: dispatchCourseId } }))
      // Persist a lightweight flag so the course page can pick it up when mounted
      try {
        if (typeof window.sessionStorage !== "undefined") {
          const key = `lesson_completed_${lessonId}`
          // store the courseId to allow course pages to ignore cross-course events
          sessionStorage.setItem(key, String(dispatchCourseId ?? ""))
        }
      } catch {
        // ignore storage errors
      }
    }

    // Re-fetch lesson data to get persisted completion state and exercises.
    // Use forceDetail to bypass batch-data cache which may be stale and keep UI in sync.
    const latest = await getLessonData(lessonId, { forceDetail: true })
    if (latest.ok) {
      setTitle(latest.data.lesson.title || `Lezione #${lessonId}`)
      setDescription(latest.data.lesson.description || "—")
      setIsCompleted(!!latest.data.lesson.is_completed)
      setCourseId(latest.data.lesson.course_id)
      setExercises(latest.data.exercises)
    }
  }

  if (!Number.isFinite(lessonId)) return <div className="p-6">ID lezione non valido.</div>

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <header className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {courseId ? <Link className="underline" to={`/learn/${courseId}`}>← Torna al corso</Link> : " "}
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</div>
        <div className="pt-2">
          <button
            onClick={onToggleComplete}
            disabled={isCompleted || toggling}
            className="rounded-lg bg-primary px-3 py-1 text-primary-foreground disabled:opacity-50"
          >
            {isCompleted ? (
              "Lezione completata"
            ) : toggling ? (
              <span className="inline-flex items-center">
                <Spinner size={16} className="mr-2" /> Segno come completata…
              </span>
            ) : (
              "Segna come completata"
            )}
          </button>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Esercizi</h2>
        {loading && (
          <div className="flex items-center gap-3">
            <Spinner />
            <span className="text-sm text-muted-foreground">Caricamento…</span>
          </div>
        )}

        {!loading && exercises.length === 0 && (
          <EmptyState title="Nessun esercizio" description="Non ci sono esercizi per questa lezione." />
        )}

        {!loading && exercises.length > 0 && (
          <div className="space-y-2">
            {exercises.map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-lg border p-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.due_at ? `Scadenza: ${new Date(e.due_at).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {!isCompleted ? (
                    <button
                      disabled
                      className="rounded-lg bg-muted/50 px-3 py-1 text-sm text-muted-foreground cursor-not-allowed"
                      title="Segna la lezione come completata per accedere all'esercizio"
                    >
                      Completa la lezione per accedere
                    </button>
                  ) : (
                    <>
                      {(e.status === "assigned" || e.status === "revision_requested" || !e.status) ? (
                        <Link className="rounded-lg bg-primary px-3 py-1 text-sm text-primary-foreground hover:opacity-90" to={`/exercises/${e.id}/submit`}>
                          Invia
                        </Link>
                      ) : (
                        <Link className="rounded-lg border px-3 py-1 text-sm hover:bg-accent" to={`/exercises/${e.id}/submit`}>
                          Apri
                        </Link>
                      )}
                      <span className="ml-2 text-xs text-muted-foreground">Lezione completata</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

  {error && <Alert variant="warning" title="Attenzione">{error}</Alert>}
    </div>
  )
}
