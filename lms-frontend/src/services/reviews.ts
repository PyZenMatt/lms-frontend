/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/reviews.ts
import { api } from "../lib/api"

type Ok<T> = { ok: true; status: number; data: T }
type Err = { ok: false; status: number; error: any }
export type Result<T> = Ok<T> | Err

const asNumber = (v: any): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

export type AssignedReview = {
  submission_id?: number
  exercise_id?: number
  exercise_title?: string
  course_id?: number
  lesson_id?: number
  submitted_at?: string
  student?: { id?: number; name?: string }
  status?: string
}

export type SubmissionFile = { url: string; name?: string }
export type Submission = {
  id: number
  exercise_id: number
  lesson_id?: number
  course_id?: number
  student?: { id?: number; name?: string }
  text?: string
  files?: SubmissionFile[]
  created_at?: string
  status?: string
  title?: string
  from_exercise?: boolean
}

function normAssigned(raw: any): AssignedReview {
  const subId = asNumber(
  // prefer explicit submission_pk (returned by backend AssignedReviewsView)
  // before falling back to generic id/pk which may be the review PK
  raw?.submission_id ?? raw?.submission?.id ?? raw?.submission_pk ?? raw?.submission?.pk ?? raw?.submissionId ?? raw?.id ?? raw?.pk
  )
  const exerciseRaw = raw?.exercise
  const exId = asNumber(
    raw?.exercise_id ?? exerciseRaw?.id ?? exerciseRaw?.exercise_id ?? raw?.exerciseId ?? raw?.pk ?? raw?.exercise_pk
  )
  return {
    submission_id: subId ?? undefined,
    exercise_id: exId ?? undefined,
    exercise_title: raw?.exercise_title ?? raw?.title ?? undefined,
    course_id: asNumber(raw?.course_id ?? raw?.course),
    lesson_id: asNumber(raw?.lesson_id ?? raw?.lesson),
    submitted_at: raw?.submitted_at ?? raw?.created_at ?? raw?.created,
    student: raw?.student ? {
      id: asNumber(raw.student.id),
      name: raw.student.name ?? raw.student.full_name ?? raw.student.username,
    } : undefined,
    status: raw?.status ?? undefined,
  }
}

function normSubmission(raw: any): Submission {
  const files: SubmissionFile[] = Array.isArray(raw?.files) ? raw.files.map((f: any) => ({
    url: String(f?.url ?? f),
    name: f?.name ?? undefined,
  })) : Array.isArray(raw?.attachments) ? raw.attachments.map((f: any) => ({
    url: String(f?.url ?? f),
    name: f?.name ?? undefined,
  })) : []
  const student = raw?.student || raw?.author
    ? {
        id: asNumber(raw?.student?.id ?? raw?.author?.id),
        name: raw?.student?.name ?? raw?.author?.name ?? raw?.student?.username ?? raw?.author?.username,
      }
    : undefined
  return {
    id: asNumber(raw?.id ?? raw?.submission_id) ?? 0,
  // prefer explicit exercise_id, else nested exercise.id
  exercise_id: asNumber(raw?.exercise_id ?? raw?.exercise?.id ?? raw?.exerciseId) ?? 0,
    lesson_id: asNumber(raw?.lesson_id ?? raw?.lesson) ?? undefined,
    course_id: asNumber(raw?.course_id ?? raw?.course) ?? undefined,
    student,
    text: raw?.text ?? raw?.answer ?? "",
    files,
    created_at: raw?.created_at ?? raw?.submitted_at ?? undefined,
    status: raw?.status ?? undefined,
    title: raw?.exercise_title ?? raw?.title ?? undefined,
  from_exercise: raw?.__from_exercise ?? raw?.from_exercise ?? false,
  }
}

// cache which endpoint style worked for an id to avoid repeated 404 probes
const endpointCache = new Map<number, "exercise" | "submission" | "review">()

/** Lista incarichi assegnati al reviewer */
export async function listAssignedReviews(): Promise<Result<AssignedReview[]>> {
  const candidates = [`/v1/reviews/assigned/`, `/v1/reviewer/assigned/`]
  for (const url of candidates) {
    const res = await api.get<any>(url)
    if (res.ok) {
      // debug: expose raw backend payload to help trace missing submission_id
      console.debug?.("[reviews.listAssignedReviews] url=", url, "raw=", res.data)
      const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      return { ok: true, status: res.status, data: arr.map(normAssigned) }
    }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No assigned reviews endpoint" }
}

/** Storico review effettuate dal reviewer corrente */
export async function listReviewsHistory(params?: { page?: number; page_size?: number }): Promise<Result<any[]>> {
  const candidates = [`/v1/reviews/history/`, `/v1/reviewer/history/`]
  for (const url of candidates) {
    const res = await api.get<any>(url, { params, query: params })
    if (res.ok) {
      const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      return { ok: true, status: res.status, data: arr }
    }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No reviews history endpoint" }
}

/** Dettaglio submission da revisionare */
export async function getSubmission(submissionId: number): Promise<Result<Submission>> {
  const paths = [
  // try reviewer-aware endpoint first (allows assigned reviewer to see submission)
  `/v1/submissions/${submissionId}/review-detail/`,
  `/v1/exercises/submissions/${submissionId}/`,
  `/v1/submissions/${submissionId}/`,
  `/v1/reviews/${submissionId}/submission/`,
    // try treating the id as an exercise id and fetch my_submission or exercise detail
    `/v1/exercises/${submissionId}/my_submission/`,
    `/v1/exercises/${submissionId}/`,
  // list submissions for exercise (some backends)
  `/v1/exercises/${submissionId}/submissions/`,
  `/v1/exercises/${submissionId}/submissions/${submissionId}/`,
  ]
  let lastNotFound = 404
  for (const url of paths) {
  const res = await api.get<any>(url)
    // if server responds 403 (Forbidden) the resource exists but you lack perms — return that to caller
    if (res.ok) {
  // mark which style worked for this id
  if (url.includes("/submissions/")) endpointCache.set(submissionId, "submission")
      // normalize if array or results
        // If the endpoint returned an exercise detail (e.g. /v1/exercises/:id/)
        // try to extract an embedded submission object (common keys) or
        // synthesize a submission using exercise fields so the UI can show the solution.
        let raw = res.data
        if (Array.isArray(raw)) raw = raw[0]
        if (raw && raw.results && Array.isArray(raw.results)) raw = raw.results[0]
    if (raw && typeof raw === "object") {
          // common embedded submission fields
          const candidate = raw.my_submission ?? raw.submission ?? raw.latest_submission ?? raw.student_submission ?? (Array.isArray(raw.submissions) ? raw.submissions[0] : undefined)
          if (candidate) {
      // ensure exercise_id is populated from nested exercise if present
      if (!candidate.exercise_id && candidate.exercise?.id) candidate.exercise_id = candidate.exercise.id
      if (candidate.exercise_id) endpointCache.set(Number(candidate.exercise_id), "exercise")
      return { ok: true, status: res.status, data: normSubmission(candidate) }
          }

          // no embedded submission — attempt to build a synthetic submission from exercise fields
          const synthesized: any = {
            id: asNumber(raw.id ?? raw.exercise_id) ?? submissionId,
            exercise_id: asNumber(raw.id ?? raw.exercise_id) ?? submissionId,
            lesson_id: asNumber(raw.lesson_id ?? raw.lesson) ?? undefined,
            course_id: asNumber(raw.course_id ?? raw.course) ?? undefined,
            student: raw.student ? { id: asNumber(raw.student.id), name: raw.student.name } : undefined,
            text: raw.solution ?? raw.answer ?? raw.text ?? raw.description ?? raw.content ?? "",
            files: Array.isArray(raw.attachments) ? raw.attachments.map((f: any) => ({ url: String(f?.url ?? f), name: f?.name })) : [],
            created_at: raw.created_at ?? raw.submitted_at ?? undefined,
            status: raw.status ?? undefined,
            title: raw.title ?? raw.name ?? undefined,
          }
          endpointCache.set(Number(synthesized.exercise_id ?? synthesized.id), "exercise")
          synthesized.__from_exercise = true
          return { ok: true, status: res.status, data: normSubmission(synthesized) }
        }
    }
    const status = (res as any).status ?? res.status
    if (status === 403) return { ok: false, status: 403, error: res.error ?? "Forbidden" }
    if (![404, 405].includes(status)) {
      return { ok: false, status, error: (res as any).error }
    }
    lastNotFound = status
  }
  return { ok: false, status: lastNotFound, error: "Submission not found" }
}

/** Invio review */
export async function sendReview(
  submissionId: number,
  payload: { score?: number; decision?: string; comment?: string; technical?: number; creative?: number; following?: number; recommendations?: string[] },
  exerciseId?: number
): Promise<Result<any>> {
  const body: any = {
    // legacy fields kept for backwards compatibility
    score: payload.score,
    grade: payload.score,
    comment: payload.comment ?? "",
  }
  if (payload.decision) body.decision = payload.decision
  // new breakdown fields (1-5) expected by updated backends
  if (typeof payload.technical === "number") body.technical = payload.technical
  if (typeof payload.creative === "number") body.creative = payload.creative
  if (typeof payload.following === "number") body.following = payload.following
  // recommendations can be an array of up to a few strings
  if (Array.isArray(payload.recommendations) && payload.recommendations.length) body.recommendations = payload.recommendations
  // prefer cached endpoint if available to avoid POSTing to many 404s
  // Build candidate paths. If caller provided an exerciseId, prefer the exercise-scoped endpoint
  const makePaths = () => {
    const base = [] as string[]
    const hint = endpointCache.get(submissionId)
    if (exerciseId) base.push(`/v1/exercises/${exerciseId}/review/`)
    // If we know this id is a submission, try submission route first
    if (hint === "submission") {
      base.push(`/v1/submissions/${submissionId}/review/`)
      base.push(`/v1/exercises/${submissionId}/review/`)
    } else {
      base.push(`/v1/exercises/${submissionId}/review/`)
      base.push(`/v1/submissions/${submissionId}/review/`)
    }
    base.push(`/v1/reviews/${submissionId}/submit/`)
    base.push(`/v1/reviews/${submissionId}/`)
    return base
  }
  const paths = makePaths()
  for (const url of paths) {
    console.debug?.("[reviews.sendReview] POSTing", url, body)
  const res = await api.post<any>(url, body)
    if (res.ok) {
      // cache which style worked
      if (url.includes("/exercises/")) endpointCache.set(submissionId, "exercise")
      else if (url.includes("/submissions/")) endpointCache.set(submissionId, "submission")
      else endpointCache.set(submissionId, "review")
      return { ok: true, status: res.status, data: res.data }
    }
    if (![404, 405, 422].includes((res as any).status ?? res.status)) {
      console.debug?.("[reviews.sendReview] POST failed non-404", url, (res as any))
  return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Review submit endpoint not found" }
}
