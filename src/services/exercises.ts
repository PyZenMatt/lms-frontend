// src/services/exercises.ts
import { api } from "../lib/api"

export type Exercise = {
  id: number
  course_id?: number | null
  lesson_id?: number | null
  title: string
  description?: string | null
  status?: "assigned" | "submitted" | "under_review" | "revision_requested" | "approved" | "rejected" | string
  due_at?: string | null
  submitted_at?: string | null
  grade?: number | null
  reviewer_comment?: string | null
}

export type ExerciseSubmissionPayload = {
  text?: string
  files?: File[] // opzionale; verrà inviato come FormData se presente
}

type Ok<T> = { ok: true; status: number; data: T }
type Err = { ok: false; status: number; error: unknown }
export type Result<T> = Ok<T> | Err

const toFormData = (payload: ExerciseSubmissionPayload) => {
  const fd = new FormData()
  if (payload.text) {
    // include both 'text' and 'content' keys for backend compatibility
    fd.set("text", payload.text)
    fd.set("content", payload.text)
  }
  if (payload.files?.length) {
    payload.files.forEach((f, i) => fd.append("files", f, f.name || `file_${i}`))
  }
  return fd
}

/**
 * Elenco delle mie submission (student) — mappa il risultato in array "Exercise-like"
 * backend: GET /api/v1/exercises/submissions/
 */
export async function listMyExercises(params?: { page?: number; page_size?: number; status?: string }): Promise<Result<Exercise[]>> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  if (params?.page_size) qs.set("page_size", String(params.page_size))
  if (params?.status) qs.set("status", String(params.status))
  const path = `/v1/exercises/submissions/${qs.toString() ? `?${qs.toString()}` : ""}`
  const res = await api.get<unknown>(path)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  const raw = res.data as unknown
  const items = Array.isArray(raw)
    ? (raw as unknown[])
    : Array.isArray((raw as unknown as { results?: unknown[] })?.results)
    ? (raw as unknown as { results?: unknown[] }).results ?? []
    : []
  // some backends return submission objects — try to map to a minimal Exercise shape
  const mapped = (items as unknown[]).map((s) => {
    const obj = s as Record<string, unknown>
    const exercise = (obj["exercise"] as Record<string, unknown> | undefined) ?? obj
    return {
      id: Number((exercise["id"] ?? obj["id"] ?? 0) as unknown),
      course_id: (exercise["course_id"] ?? exercise["course"]) as unknown as number | null ?? null,
      lesson_id: (exercise["lesson_id"] as unknown as number) ?? null,
      title: (exercise["title"] ?? exercise["name"] ?? obj["title"] ?? "Esercizio") as string,
      description: (exercise["description"] ?? obj["text"]) as string | null,
      status: (obj["status"] ?? exercise["status"]) as string | null,
      due_at: (exercise["due_at"] as unknown as string) ?? null,
      submitted_at: (obj["submitted_at"] as unknown as string) ?? null,
      grade: (obj["grade"] as unknown as number) ?? null,
      reviewer_comment: (obj["reviewer_comment"] as unknown as string) ?? null,
    } as Exercise
  })
  return { ok: true, status: res.status, data: mapped }
}

/** Recupera un esercizio; prova prima /api/v1/exercises/:id/ poi fallback a my_submission */
export async function getExercise(exerciseId: number): Promise<Result<Exercise>> {
  // try canonical exercise detail
  const res = await api.get<unknown>(`/v1/exercises/${exerciseId}/`)
  if (res.ok && res.data) {
    const d = res.data as Record<string, unknown>
    return {
      ok: true,
      status: res.status,
      data: {
        id: Number(d["id"] ?? exerciseId),
  course_id: (d["course_id"] ?? d["course"]) as unknown as number | null ?? null,
  lesson_id: (d["lesson_id"] as unknown as number) ?? null,
        title: (d["title"] ?? d["name"] ?? `Esercizio #${exerciseId}`) as string,
        description: (d["description"] as string) ?? null,
  status: (d["status"] as unknown as string) ?? null,
        due_at: (d["due_at"] as string) ?? null,
      } as Exercise,
    }
  }

  // fallback: try my_submission endpoint which often contains exercise info
  const res2 = await api.get<unknown>(`/v1/exercises/${exerciseId}/my_submission/`)
  if (res2.ok && res2.data) {
    const s = res2.data as Record<string, unknown>
    const exercise = (s["exercise"] as Record<string, unknown> | undefined) ?? s
    return {
      ok: true,
      status: res2.status,
      data: {
        id: Number((exercise["id"] ?? exercise["exercise_id"] ?? exercise["pk"] ?? exercise["submission_id"] ?? exerciseId) as number),
  course_id: (exercise["course_id"] ?? exercise["course"]) as unknown as number | null ?? null,
  lesson_id: (exercise["lesson_id"] as unknown as number) ?? null,
        title: (exercise["title"] ?? s["title"] ?? `Esercizio #${exerciseId}`) as string,
        description: (exercise["description"] ?? s["text"]) as string | null,
        status: (s["status"] ?? exercise["status"]) as string | null,
        due_at: (exercise["due_at"] as string) ?? null,
      } as Exercise,
    }
  }

  return { ok: false, status: res2.status ?? res.status ?? 404, error: res2.error ?? res.error }
}

/** Invio consegna studente */
export async function submitExercise(exerciseId: number, payload: ExerciseSubmissionPayload): Promise<Result<unknown>> {
  const url = `/api/v1/exercises/${exerciseId}/submit/`
  // 1) tenta multipart/form-data se ci sono file
  if (payload.files?.length) {
  const res = await api.post<unknown>(url, toFormData(payload))
  if (res.ok) return { ok: true, status: res.status, data: res.data }
    // se il server rifiuta il multipart, provo JSON minimale come fallback
      if (![400, 415, 422].includes(res.status)) {
        return { ok: false, status: res.status, error: res.error }
    }
  }
  // 2) fallback JSON (solo testo) — include 'content' for backend
  const res2 = await api.post<unknown>(url, { text: payload.text ?? "", content: payload.text ?? "" })
  if (res2.ok) return { ok: true, status: res2.status, data: res2.data }
  return { ok: false, status: res2.status, error: res2.error }
}

// --- Course / Lesson batch helpers ---

export async function getCourseBatchData(courseId: number): Promise<Result<unknown>> {
  const res = await api.get<unknown>(`/api/v1/course/${courseId}/batch-data/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  return { ok: true, status: res.status, data: res.data }
}

export async function getLessonBatchData(lessonId: number): Promise<Result<unknown>> {
  const res = await api.get<unknown>(`/api/v1/lesson/${lessonId}/batch-data/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  return { ok: true, status: res.status, data: res.data }
}

export async function listCourseLessons(courseId: number): Promise<Result<unknown[]>> {
  const res = await api.get<unknown>(`/v1/courses/${courseId}/lessons/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  const data = Array.isArray(res.data) ? res.data as unknown[] : (res.data as unknown as { results?: unknown[] })?.results ?? []
  return { ok: true, status: res.status, data }
}

export async function listLessonExercises(lessonId: number): Promise<Result<unknown[]>> {
  const res = await api.get<unknown>(`/v1/lessons/${lessonId}/exercises/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  const data = Array.isArray(res.data) ? res.data as unknown[] : (res.data as unknown as { results?: unknown[] })?.results ?? []
  return { ok: true, status: res.status, data }
}

export async function markLessonComplete(lessonId: number): Promise<Result<unknown>> {
  const res = await api.post<unknown>(`/api/v1/lessons/${lessonId}/mark_complete/`, {})
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  return { ok: true, status: res.status, data: res.data }
}

// --- My submission detail/listing ---
export async function getMySubmission(exerciseId: number): Promise<Result<unknown>> {
  const res = await api.get<unknown>(`/v1/exercises/${exerciseId}/my_submission/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  return { ok: true, status: res.status, data: res.data }
}

// --- Reviews (peer) ---
export async function listAssignedReviews(): Promise<Result<unknown[]>> {
  const res = await api.get<unknown>(`/v1/reviews/assigned/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  const data = Array.isArray(res.data) ? res.data as unknown[] : (res.data as unknown as { results?: unknown[] })?.results ?? []
  return { ok: true, status: res.status, data }
}

export async function listReviewHistory(): Promise<Result<unknown[]>> {
  const res = await api.get<unknown>(`/v1/reviews/history/`)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  const data = Array.isArray(res.data) ? res.data as unknown[] : (res.data as unknown as { results?: unknown[] })?.results ?? []
  return { ok: true, status: res.status, data }
}

export async function postReview(exerciseOrSubmissionId: number, payload: { grade?: number; score?: number; comment?: string }): Promise<Result<unknown>> {
  const score = payload.score ?? payload.grade
  const body = { score, grade: score, comment: payload.comment ?? "" }
  const res = await api.post<unknown>(`/v1/exercises/${exerciseOrSubmissionId}/review/`, body)
  if (!res.ok) return { ok: false, status: res.status, error: res.error }
  return { ok: true, status: res.status, data: res.data }
}
