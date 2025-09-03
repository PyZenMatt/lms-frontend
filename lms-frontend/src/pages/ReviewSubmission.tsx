// src/pages/ReviewSubmission.tsx
import React from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { getSubmission, sendReview } from "../services/reviews"
import { Alert } from "../components/ui/alert"
import { Spinner } from "../components/ui/spinner"

export default function ReviewSubmission() {
  const { id } = useParams<{ id: string }>()
  const submissionId = Number(id)
  const navigate = useNavigate()

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [title, setTitle] = React.useState<string>("Esercizio")
  const [text, setText] = React.useState<string>("")
  const [files, setFiles] = React.useState<{ url: string; name?: string }[]>([])
  const [status, setStatus] = React.useState<string>("")
  const [courseId, setCourseId] = React.useState<number | undefined>(undefined)
  const [lessonId, setLessonId] = React.useState<number | undefined>(undefined)
  const [exerciseId, setExerciseId] = React.useState<number | undefined>(undefined)
  const [studentName, setStudentName] = React.useState<string | undefined>(undefined)

  const [score, setScore] = React.useState<number | "">("")
  const [technical, setTechnical] = React.useState<number | "">("")
  const [creative, setCreative] = React.useState<number | "">("")
  const [following, setFollowing] = React.useState<number | "">("")
  const [comment, setComment] = React.useState<string>("")
  const [submitting, setSubmitting] = React.useState(false)
  const [submittedMsg, setSubmittedMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      const res = await getSubmission(submissionId)
      if (!mounted) return
        if (!res.ok) {
          setError(`Impossibile caricare la submission (HTTP ${res.status})`)
        } else {
        setTitle(res.data.title || `Submission #${submissionId}`)
        setText(res.data.text || "")
        setFiles(res.data.files || [])
        setStatus(res.data.status || "")
        // normalize potentially-heterogeneous backend fields safely
        const raw = res.data as unknown as Record<string, unknown> | undefined;
        setCourseId(typeof raw?.course_id === "number" ? (raw.course_id as number) : undefined);
        setLessonId(typeof raw?.lesson_id === "number" ? (raw.lesson_id as number) : undefined);
        // exercise id might be provided as exercise_id or exerciseId and as string or number
        let exerciseParsed: number | undefined = undefined;
        if (raw) {
          const v1 = raw["exercise_id"];
          const v2 = raw["exerciseId"];
          if (typeof v1 === "number") exerciseParsed = v1;
          else if (typeof v1 === "string" && /^\d+$/.test(v1)) exerciseParsed = Number(v1);
          else if (typeof v2 === "number") exerciseParsed = v2;
          else if (typeof v2 === "string" && /^\d+$/.test(v2)) exerciseParsed = Number(v2);
        }
        setExerciseId(exerciseParsed);
  const studentObj = raw?.student as Record<string, unknown> | undefined;
  setStudentName(studentObj && typeof studentObj === "object" && typeof studentObj.name === "string" ? (studentObj.name as string) : undefined)
          // If the submission was synthesized from exercise detail, we can still post using exerciseId.
          // We'll render a non-blocking note instead of hard error.
      }
      setLoading(false)
    }
    // avoid calling backend for invalid/non-positive ids (e.g. 0)
    if (Number.isFinite(submissionId) && submissionId > 0) load()
    return () => { mounted = false }
  }, [submissionId])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setSubmittedMsg(null)
    setError(null)
    const numericScore = typeof score === "number" ? score : undefined
    const tech = typeof technical === "number" ? technical : undefined
    const creat = typeof creative === "number" ? creative : undefined
    const foll = typeof following === "number" ? following : undefined
    if (numericScore !== undefined && (numericScore < 1 || numericScore > 10)) {
      setError("Il punteggio deve essere compreso tra 1 e 10.")
      setSubmitting(false)
      return
    }
    // If reviewer provided the 3 sub-scores (1-5) prefer sending them
    let payload: any
    if (tech && creat && foll) {
      // send breakdown fields (backend will compute legacy score)
      payload = {
        technical: tech,
        creative: creat,
        following: foll,
        comment: comment?.trim() || undefined,
      }
    } else {
      payload = { score: numericScore, comment: comment?.trim() || undefined }
    }
    const res = await sendReview(submissionId, payload, exerciseId)
    setSubmitting(false)
    if (!res.ok) {
      setError(`Invio review non riuscito (HTTP ${res.status}). Probabilmente il backend non espone un endpoint per la submission. (${res.error ?? ""})`)
      return
    }
    setSubmittedMsg("Review inviata. Grazie! L'esito sarà notificato allo studente.")
    // opzionale: torna all'elenco dopo breve pausa
    setTimeout(() => navigate("/reviews/assigned"), 1200)
  }

  if (!Number.isFinite(submissionId) || submissionId <= 0) return <div className="p-6">ID submission non valido.</div>

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="text-sm text-muted-foreground flex gap-3">
        <Link className="underline" to="/reviews/assigned">← Torna alle revisioni</Link>
        {courseId && <Link className="underline" to={`/learn/${courseId}`}>Apri corso</Link>}
        {lessonId && <Link className="underline" to={`/lessons/${lessonId}`}>Apri lezione</Link>}
      </div>

      <h1 className="text-2xl font-semibold">Revisione • Sub #{submissionId}</h1>
      <div className="text-sm text-muted-foreground">
        {studentName ? `Studente: ${studentName} • ` : ""} Stato: <b>{status || "—"}</b>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-3 text-sm text-muted-foreground">Caricamento in corso…</span>
        </div>
      )}
      {error && <Alert variant="error" title="Errore">{error}</Alert>}
      {/* Non-blocking note when we only have exercise detail */}
      {!loading && !error && !files.length && !text && exerciseId && (
        <Alert variant="warning" title="Nota">Dettagli submission non disponibili; stai revisionando via esercizio #{exerciseId}. L'invio userà l'endpoint per esercizio.</Alert>
      )}
      {submittedMsg && <Alert variant="success">{submittedMsg}</Alert>}

      {!loading && !error && (
        <>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="text-sm font-medium">{title}</div>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">{text || "—"}</div>
            {files.length > 0 && (
              <div className="space-y-1">
                <div className="text-sm font-medium">Allegati</div>
                <ul className="list-inside list-disc text-sm">
                  {files.map((f, i) => (
                    <li key={i}>
                      <a className="underline" href={f.url} target="_blank" rel="noreferrer">
                        {f.name || f.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Punteggio (1–10)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={score}
                  onChange={(e) => {
                    const v = e.target.value
                    setScore(v === "" ? "" : Math.max(1, Math.min(10, Number(v))))
                  }}
                  className="h-9 w-full rounded-md border px-2"
                  disabled={submitting || !!submittedMsg}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Breakdown (1–5)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" min={1} max={5} placeholder="T" value={technical}
                    onChange={(e) => { const v = e.target.value; setTechnical(v === "" ? "" : Math.max(1, Math.min(5, Number(v)))) }}
                    className="h-9 w-full rounded-md border px-2" disabled={submitting || !!submittedMsg} />
                  <input type="number" min={1} max={5} placeholder="C" value={creative}
                    onChange={(e) => { const v = e.target.value; setCreative(v === "" ? "" : Math.max(1, Math.min(5, Number(v)))) }}
                    className="h-9 w-full rounded-md border px-2" disabled={submitting || !!submittedMsg} />
                  <input type="number" min={1} max={5} placeholder="F" value={following}
                    onChange={(e) => { const v = e.target.value; setFollowing(v === "" ? "" : Math.max(1, Math.min(5, Number(v)))) }}
                    className="h-9 w-full rounded-md border px-2" disabled={submitting || !!submittedMsg} />
                </div>
                <div className="text-xs text-muted-foreground">If you fill all three fields, the breakdown will be submitted instead of the 1–10 score.</div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Commento</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Spiega al candidato i punti di forza e cosa migliorare…"
                className="min-h-[120px] w-full rounded-lg border p-3"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50 inline-flex items-center"
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2" size={16} />
                    Invio in corso…
                  </>
                ) : (
                  "Invia review"
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
}
