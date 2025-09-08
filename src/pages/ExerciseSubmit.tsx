// src/pages/ExerciseSubmit.tsx
import React from "react"
import { useParams } from "react-router-dom"
import { getExercise, submitExercise, getMySubmission } from "../services/exercises"
import { Alert } from "../components/ui/alert"
import { Spinner } from "../components/ui/spinner"
import { showToast } from "../lib/toast"

export default function ExerciseSubmit() {
  const { id } = useParams<{ id: string }>()
  const exerciseId = Number(id)

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>("")
  const [description, setDescription] = React.useState<string>("—")
  const [status, setStatus] = React.useState<string>("")
  const [reviewsCount, setReviewsCount] = React.useState<number | null>(null)
  const [text, setText] = React.useState<string>("")
  const [files, setFiles] = React.useState<File[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [submittedMsg, setSubmittedMsg] = React.useState<string | null>(null)
  const [hasSubmitted, setHasSubmitted] = React.useState<boolean>(false)
  const submitStartRef = React.useRef<number | null>(null)
  const successBannerRef = React.useRef<HTMLDivElement | null>(null)

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
        // If the server reports this exercise as already submitted, lock the UI
        if ((res.data.status ?? "") === "submitted") {
          setHasSubmitted(true)
        }
      }
      // try to get my submission and reviews count
      const my = await getMySubmission(exerciseId)
      if (my.ok && my.data) {
        const d = my.data as Record<string, unknown>
        // If there's a submission object, mark as already submitted
        setHasSubmitted(true)
        // prefer explicit reviews array
        if (Array.isArray(d.reviews)) setReviewsCount(d.reviews.length)
        else if (typeof d.reviews_count === "number") setReviewsCount(d.reviews_count)
        else if (typeof d.review_count === "number") setReviewsCount(d.review_count)
        else setReviewsCount(null)
      }
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [exerciseId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Telemetry: click
  try { window.dispatchEvent(new CustomEvent("exercise_submit_click", { detail: { lessonId: exerciseId } })) } catch (e) { console.debug("dispatch error", e) }

    if (submitting) return // prevent double submit
    setSubmitting(true)
    setSubmittedMsg(null)
    setError(null)
    submitStartRef.current = Date.now()
    const res = await submitExercise(exerciseId, { text: text?.trim() || undefined, files })
    const latency = submitStartRef.current ? Date.now() - submitStartRef.current : null
    setSubmitting(false)

    if (!res.ok) {
      // Error toast + keep UI active
      const msg = res.status && res.status >= 400 && res.status < 500 ? "Controlla il testo/allegati e riprova." : "Invio non riuscito. Riprova più tardi."
      showToast({ variant: "error", message: msg })
      setError(`Invio non riuscito (HTTP ${res.status}). Controlla i campi e riprova.`)
      try {
        const r = res as { error?: string }
        window.dispatchEvent(new CustomEvent("exercise_submit_error", { detail: { lessonId: exerciseId, httpStatus: res.status, errorCode: r?.error ?? null } }))
      } catch (e) { console.debug("dispatch error", e) }
      return
    }

    // Success: show toast, lock UI, badge
    showToast({ variant: "success", message: "Esercizio inviato. Riceverai una notifica quando sarà revisionato.", duration: 5000 })
    setSubmittedMsg("Consegna inviata correttamente. Non potrai più inviare una nuova consegna per questo esercizio.")
    setText("")
    setFiles([])
    setHasSubmitted(true)
    try {
      const r = res as { data?: { id?: number | string } }
      const submissionId = r?.data?.id ?? null
      window.dispatchEvent(new CustomEvent("exercise_submitted", { detail: { lessonId: exerciseId, submissionId, hasAttachments: files.length > 0, latencyMs: latency, result: "success" } }))
    } catch (e) { console.debug("dispatch error", e) }
    // Move focus to success banner for a11y
    window.setTimeout(() => successBannerRef.current?.focus(), 0)
  }

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
      {submittedMsg && (
        <div tabIndex={-1} ref={successBannerRef} aria-live="polite">
          <Alert variant="success">{submittedMsg}</Alert>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-card">
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{description}</div>
            <div className="mt-2 text-xs text-muted-foreground">Stato corrente: <b>{status || "—"}</b></div>
          </div>

      <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Risposta (testo)</label>
              <textarea
                value={text}
        onChange={(e) => setText(e.target.value)}
                placeholder="Scrivi qui la tua risposta…"
                className="min-h-[120px] w-full rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground p-3 focus-ring"
        disabled={submitting || hasSubmitted}
        aria-disabled={submitting || hasSubmitted}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Allegati (opzionali)</label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-muted-foreground"
                disabled={submitting}
                aria-disabled={submitting}
              />
              {files.length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">{files.length} file selezionati</div>
              )}
            </div>

              <div className="pt-2">
                {hasSubmitted ? (
                  <div className="inline-flex items-center gap-3">
                    <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-black">Inviato per revisione</span>
                    <Alert variant="warning">Hai già inviato questo esercizio. Non puoi inviare nuovamente.</Alert>
                  </div>
                ) : submitting ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 inline-flex items-center justify-center focus-ring"
                    aria-disabled
                  >
                    <Spinner size={16} className="mr-2" />
                    Invio in corso…
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || (status === "submitted" && (reviewsCount === null || reviewsCount < 3))}
                    className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 inline-flex items-center justify-center focus-ring"
                    title={status === "submitted" && (reviewsCount === null || reviewsCount < 3) ? "La tua consegna è in attesa di valutazioni: non puoi reinviare finché non riceve 3 valutazioni." : undefined}
                  >
                    Invia esercizio
                  </button>
                )}
              </div>
            </form>
        </>
      )}
    </div>
  )
}
