// src/services/courses.ts
import { api } from "@/lib/api"

export type CourseOutlineLesson = {
  id: number
  title: string
  section_id?: number | null
  position?: number | null
  duration_sec?: number | null
  content_type?: string | null
  is_free_preview?: boolean
  lock_reason?: string | null
  exercise?: {
    id: number
    title: string
    description?: string | null
    time_estimate?: number | null
    unlocked?: boolean
    completed?: boolean
  } | null
}

export type CourseOutlinePayload = {
  course: {
    id: number
    title: string
    slug?: string | null
    cover?: string | null
    teacher?: any
    enrollment_status: "enrolled" | "not_enrolled"
  }
  sections: any[]
  lessons: CourseOutlineLesson[]
  progress: { completed_lesson_ids: number[]; percent: number; next_lesson_id: number | null }
}

export async function getCourseOutline(courseId: number): Promise<{ ok: boolean; status: number; data?: CourseOutlinePayload; error?: any }> {
  const path = `/api/v1/courses/${courseId}/outline/?include_progress=1`
  const res = await api.get<CourseOutlinePayload>(path)
  if (res.ok) return { ok: true, status: res.status, data: res.data }
  return { ok: false, status: res.status, error: res.error }
}
// ...existing code...

// -------------------------
// Costanti / Tipi categoria
// -------------------------
export const CATEGORIES = [
  "disegno",
  "pittura-olio",
  "acquerello",
  "tempera",
  "acrilico",
  "scultura",
  "storia-arte",
  "fotografia",
  "illustrazione",
  "arte-digitale",
  "ceramica",
  "incisione",
  "mosaico",
  "restauro",
  "calligrafia",
  "fumetto",
  "design-grafico",
  "arte-contemporanea",
  "arte-classica",
  "other",
] as const

export type Category = typeof CATEGORIES[number]
export function isValidCategory(x: unknown): x is Category {
  return typeof x === "string" && (CATEGORIES as readonly string[]).includes(x)
}

// -------------------------
// Tipi corso / paginazione
// -------------------------
export type Course = {
  id: number | string
  title: string
  description?: string
  cover_image?: string | null
  price?: number | null
  currency?: string | null
  progress_percent?: number | null
  students_count?: number | null
  lessons_count?: number | null
  created_at?: string
  updated_at?: string
  category?: Category | string | null
}

type DrfPaginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export type ListParams = {
  page?: number
  page_size?: number
  search?: string
  ordering?: string // es. "title" | "-created_at"
  category?: string // facoltativo: se il BE accetta filtro categoria
}

export type ListOut = {
  ok: boolean
  status: number
  data: Course[]
  count?: number
  next?: string | null
  previous?: string | null
}

// -------------------------
// Helpers normalizzazione
// -------------------------
function normalizeList(payload: Course[] | DrfPaginated<Course>): ListOut {
  if (Array.isArray(payload)) {
    return { ok: true, status: 200, data: payload, count: payload.length, next: null, previous: null }
  }
  return {
    ok: true,
    status: 200,
    data: payload.results ?? [],
    count: payload.count,
    next: payload.next,
    previous: payload.previous,
  }
}

// -------------------------
// API
// -------------------------
export async function listCourses(params: ListParams = {}) {
  const res = await api.get<Course[] | DrfPaginated<Course>>("/v1/courses/", { params: params as any })
  if (!res.ok) return { ok: false as const, status: res.status, data: [] as Course[] } as ListOut
  return normalizeList(res.data!)
}

export async function getCourse(id: number | string) {
  const res = await api.get<Course>(`/v1/courses/${id}/`)
  if (!res.ok) return { ok: false as const, status: res.status, data: null as any as Course }
  return { ok: true as const, status: res.status, data: res.data }
}
