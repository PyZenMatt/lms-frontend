// src/services/lessons.ts
import { api } from "../lib/api"

export type Lesson = {
  id: number
  title: string
  description?: string | null
  duration_min?: number | null
  is_completed?: boolean
  order?: number
  course_id?: number
}

export type Exercise = {
  id: number
  lesson_id: number
  title: string
  description?: string | null
  status?: string | null // assigned/submitted/...
  due_at?: string | null
}

type Ok<T> = { ok: true; status: number; data: T }
type Err = { ok: false; status: number; error: any }
export type Result<T> = Ok<T> | Err

function asNumber(v: any): number | undefined {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

function normLesson(raw: any): Lesson {
  return {
    id: asNumber(raw?.id ?? raw?.pk) ?? 0,
    title: String(raw?.title ?? raw?.name ?? "Lezione"),
  // backend Lesson model stores the main text in `content` — accept either
  description: raw?.description ?? raw?.content ?? null,
    duration_min: typeof raw?.duration_min === "number" ? raw.duration_min : asNumber(raw?.duration) ?? undefined,
    is_completed: !!(raw?.is_completed ?? raw?.completed),
    order: asNumber(raw?.order ?? raw?.position),
    course_id: asNumber(raw?.course_id ?? raw?.course),
  }
}

function normExercise(raw: any): Exercise {
  return {
    id: asNumber(raw?.id ?? raw?.pk) ?? 0,
    lesson_id: asNumber(raw?.lesson_id ?? raw?.lesson) ?? 0,
    title: String(raw?.title ?? raw?.name ?? "Esercizio"),
    description: raw?.description ?? null,
    status: raw?.status ?? null,
    due_at: raw?.due_at ?? raw?.deadline ?? null,
  }
}

/** Carica dati lezione + esercizi (batch-data se disponibile, altrimenti fallback) */
export async function getLessonData(
  lessonId: number,
  opts?: { forceDetail?: boolean }
): Promise<Result<{ lesson: Lesson; exercises: Exercise[] }>> {
  // 1) Tentativo: batch-data (include lesson + exercises)
  // Se l'opzione forceDetail è true, skippo il batch-data per forzare il dettaglio
  if (!opts?.forceDetail) {
  const bd = await api.get<any>(`/api/v1/lesson/${lessonId}/batch-data/`)
    if (bd.ok) {
      const lraw = bd.data?.lesson ?? bd.data
      const eraw = Array.isArray(bd.data?.exercises)
        ? bd.data.exercises
        : Array.isArray(bd.data?.items)
        ? bd.data.items
        : []
      const lesson = normLesson(lraw)
      // batch-data may expose completion under `completion.is_completed` or lesson.completed
      const completionFlag = bd.data?.completion?.is_completed ?? bd.data?.lesson?.completed
      if (typeof completionFlag !== "undefined") {
        lesson.is_completed = !!completionFlag
      }
      return {
        ok: true,
        status: bd.status,
        data: { lesson, exercises: eraw.map(normExercise) },
      }
    }
  }

  // 2) Fallback: lezione singola
  const lres = await api.get<any>(`/v1/lessons/${lessonId}/`)
  if (!lres.ok) return { ok: false, status: lres.status, error: (lres as any).error }
  const lesson = normLesson(lres.data)

  // 3) Fallback: esercizi della lezione
  const ex = await api.get<any>(`/v1/lessons/${lessonId}/exercises/`)
  const list = ex.ok
    ? (Array.isArray(ex.data) ? ex.data : Array.isArray(ex.data?.results) ? ex.data.results : []).map(normExercise)
    : []

  return { ok: true, status: lres.status, data: { lesson, exercises: list } }
}

/** Segna come completata una lezione (idempotente) */
export async function markLessonComplete(lessonId: number): Promise<Result<any>> {
  const res = await api.post<any>(`/v1/lessons/${lessonId}/mark_complete/`, {})
  if (res.ok) return { ok: true, status: res.status, data: res.data }
  return { ok: false, status: res.status, error: (res as any).error }
}
