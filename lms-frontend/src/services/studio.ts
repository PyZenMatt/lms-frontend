// src/services/studio.ts
import { api } from "../lib/api"

type Ok<T> = { ok: true; status: number; data: T }
type Err = { ok: false; status: number; error: any }
export type Result<T> = Ok<T> | Err

const asNumber = (v: any): number | undefined => {
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
const asBool = (v: any): boolean | undefined => {
  if (v === true || v === "true" || v === 1 || v === "1") return true
  if (v === false || v === "false" || v === 0 || v === "0") return false
  return undefined
}

export type CourseAdmin = {
  id: number
  title: string
  description?: string | null
  price?: number | null
  currency?: string
  status?: "draft" | "published" | string
  cover_url?: string | null
  category?: string | number | null
}
export type CourseInput = {
  title: string
  description?: string
  price?: number | null
  currency?: string
  status?: "draft" | "published"
  category?: string | number | null
  cover_file?: File
  cover_url?: string
}

// Category options copied from backend Course.CATEGORY_CHOICES
export const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "disegno", label: "✏️ Disegno" },
  { value: "pittura-olio", label: "🎨 Pittura ad Olio" },
  { value: "acquerello", label: "💧 Acquerello" },
  { value: "tempera", label: "🖌️ Tempera" },
  { value: "acrilico", label: "🌈 Pittura Acrilica" },
  { value: "scultura", label: "🗿 Scultura" },
  { value: "storia-arte", label: "📚 Storia dell'Arte" },
  { value: "fotografia", label: "📸 Fotografia Artistica" },
  { value: "illustrazione", label: "🖊️ Illustrazione" },
  { value: "arte-digitale", label: "💻 Arte Digitale" },
  { value: "ceramica", label: "🏺 Ceramica e Terracotta" },
  { value: "incisione", label: "⚱️ Incisione e Stampa" },
  { value: "mosaico", label: "🔷 Mosaico" },
  { value: "restauro", label: "🛠️ Restauro Artistico" },
  { value: "calligrafia", label: "✒️ Calligrafia" },
  { value: "fumetto", label: "💭 Fumetto e Graphic Novel" },
  { value: "design-grafico", label: "🎨 Design Grafico" },
  { value: "arte-contemporanea", label: "🆕 Arte Contemporanea" },
  { value: "arte-classica", label: "🏛️ Arte Classica" },
  { value: "other", label: "🎭 Altro" },
]

export type LessonAdmin = {
  id: number
  course_id: number
  title: string
  description?: string | null
  duration_min?: number | null
  is_published?: boolean
}
export type LessonInput = {
  title: string
  description?: string
  duration_min?: number | null
  is_published?: boolean
  lesson_type?: string
  video_file?: File
}

export type ExerciseAdmin = {
  id: number
  lesson_id: number
  title: string
  description?: string | null
  exercise_type?: string | null
  difficulty?: string | null
  time_estimate?: number | null
  materials?: string | null
  instructions?: string | null
  reference_image_url?: string | null
  created_at?: string | null
  updated_at?: string | null
}
export type ExerciseInput = {
  title: string
  description: string
  exercise_type?: string
  difficulty?: string
  time_estimate?: number | null
  materials?: string | null
  instructions?: string | null
  reference_image?: File
  course_id?: number
}

function normCourse(raw: any): CourseAdmin {
  const price =
    asNumber(raw?.price_eur ?? raw?.price_amount ?? raw?.price) ??
    (typeof raw?.price === "string" ? Number(String(raw.price).replace(",", ".")) : undefined)
  return {
    id: asNumber(raw?.id ?? raw?.pk) ?? 0,
    title: String(raw?.title ?? raw?.name ?? "Corso"),
    description: raw?.description ?? null,
    price: price ?? null,
    currency: raw?.currency ?? "EUR",
    status: raw?.status ?? (asBool(raw?.published) ? "published" : "draft"),
    cover_url: raw?.cover_url ?? raw?.cover_image_url ?? raw?.cover_image ?? null,
    category: raw?.category ?? raw?.category_id ?? null,
  }
}

function normLesson(raw: any): LessonAdmin {
  return {
    id: asNumber(raw?.id ?? raw?.pk) ?? 0,
    course_id: asNumber(raw?.course_id ?? raw?.course) ?? 0,
    title: String(raw?.title ?? raw?.name ?? "Lezione"),
    description: raw?.description ?? null,
    duration_min: asNumber(raw?.duration_min ?? raw?.duration) ?? null,
    is_published: asBool(raw?.is_published ?? raw?.published),
  }
}

function normExercise(raw: any): ExerciseAdmin {
  return {
    id: asNumber(raw?.id ?? raw?.pk) ?? 0,
    lesson_id: asNumber(raw?.lesson_id ?? raw?.lesson) ?? 0,
    title: String(raw?.title ?? raw?.name ?? "Esercizio"),
  description: raw?.description ?? null,
  exercise_type: raw?.exercise_type ?? null,
  difficulty: raw?.difficulty ?? null,
  time_estimate: asNumber(raw?.time_estimate ?? raw?.time_estimate_min ?? raw?.time_estimate_minutes) ?? null,
  materials: raw?.materials ?? null,
  instructions: raw?.instructions ?? null,
  reference_image_url: raw?.reference_image_url ?? raw?.reference_image ?? null,
  created_at: raw?.created_at ?? null,
  updated_at: raw?.updated_at ?? null,
  }
}

/* -------------------------------- Courses -------------------------------- */

export async function listTeachingCourses(params?: {
  page?: number
  page_size?: number
  search?: string
  status?: string
  mine?: number
}): Promise<Result<{ items: CourseAdmin[]; count?: number }>> {
  // If caller asked for `mine=1` we MUST only call teacher-scoped endpoints (no fallback to public /v1/courses/)
  const candidates = params?.mine === 1
    ? [
        { url: `/v1/teacher/courses/`, q: params },
        { url: `/v1/courses-service/`, q: params },
      ]
    : [
        // Backend mounts courses.urls under /api/v1/ -> frontend api helper maps /v1/... to API base
        { url: `/v1/teacher/courses/`, q: params },
        { url: `/v1/courses/`, q: { ...params, mine: 1 } },
        { url: `/v1/courses-service/`, q: params },
      ]
  for (const c of candidates) {
  const res = await api.get<any>(c.url, { params: c.q })
    if (res.ok) {
      const items = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      const count = res.data?.count
      return { ok: true, status: res.status, data: { items: items.map(normCourse), count } }
    }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No teaching courses endpoint" }
}

export async function getCourseAdmin(courseId: number): Promise<Result<CourseAdmin>> {
  const paths = [`/v1/teacher/courses/${courseId}/`, `/v1/courses/${courseId}/`, `/v1/courses-service/${courseId}/`]
  for (const p of paths) {
    const res = await api.get<any>(p)
    if (res.ok) return { ok: true, status: res.status, data: normCourse(res.data) }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Course not found" }
}

export async function createCourse(input: CourseInput): Promise<Result<CourseAdmin>> {
  // if file -> FormData; otherwise JSON
  if (input.cover_file) {
    const fd = new FormData()
    fd.set("title", input.title)
    if (input.description) fd.set("description", input.description)
    if (typeof input.price === "number") fd.set("price", String(input.price))
    if (input.currency) fd.set("currency", input.currency)
    if (input.status) fd.set("status", input.status)
    if (input.category != null) fd.set("category", String(input.category))
  // backend Course model expects field `cover_image`
  fd.append("cover_image", input.cover_file, input.cover_file.name)

    for (const p of [`/v1/teacher/courses/`, `/v1/courses/`, `/v1/courses-service/`]) {
      const res = await api.post<any>(p, fd)
      if (res.ok) return { ok: true, status: res.status, data: normCourse(res.data) }
      if (![404, 405, 415, 422].includes((res as any).status ?? res.status)) {
        return { ok: false, status: res.status, error: (res as any).error }
      }
    }
  }

  // JSON fallback
  // Only send fields accepted by CourseSerializer: title, description, category, price (source -> price_eur), cover_image handled by multipart or cover_url
  const body: any = {
    title: input.title,
    description: input.description ?? "",
    price: input.price ?? null,
    category: input.category ?? null,
    cover_url: input.cover_url,
  }
  for (const p of [`/v1/teacher/courses/`, `/v1/courses/`, `/v1/courses-service/`]) {
    const res = await api.post<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normCourse(res.data) }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Create course endpoint not found" }
}

export async function updateCourse(courseId: number, input: Partial<CourseInput>): Promise<Result<CourseAdmin>> {
  // PATCH; if file, try multipart
  if (input.cover_file) {
    const fd = new FormData()
    if (input.title) fd.set("title", input.title)
    if (input.description != null) fd.set("description", input.description)
    if (typeof input.price === "number") fd.set("price", String(input.price))
    if (input.currency) fd.set("currency", input.currency)
    if (input.status) fd.set("status", input.status)
    if (input.category != null) fd.set("category", String(input.category))
  // backend Course model expects field `cover_image`
  fd.append("cover_image", input.cover_file, input.cover_file.name)

    for (const p of [`/v1/teacher/courses/${courseId}/`, `/v1/courses/${courseId}/`, `/v1/courses-service/${courseId}/`]) {
      const res = await api.patch<any>(p, fd)
      if (res.ok) return { ok: true, status: res.status, data: normCourse(res.data) }
      if (![404, 405, 415, 422].includes((res as any).status ?? res.status)) {
        return { ok: false, status: res.status, error: (res as any).error }
      }
    }
  }

  const body: any = {}
  if (input.title != null) body.title = input.title
  if (input.description != null) body.description = input.description
  if (input.price != null) body.price = input.price
  if (input.currency != null) body.currency = input.currency
  if (input.status != null) body.status = input.status
  if (input.category != null) body.category = input.category
  if (input.cover_url != null) body.cover_url = input.cover_url

  for (const p of [`/v1/teacher/courses/${courseId}/`, `/v1/courses/${courseId}/`, `/v1/courses-service/${courseId}/`]) {
    const res = await api.patch<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normCourse(res.data) }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Update course endpoint not found" }
}

/* -------------------------------- Lessons -------------------------------- */

export async function listLessons(courseId: number): Promise<Result<LessonAdmin[]>> {
  const paths = [`/v1/courses/${courseId}/lessons/`, `/v1/teacher/courses/${courseId}/lessons/`, `/v1/lessons/all/`]
  for (const p of paths) {
    const res = await api.get<any>(p)
    if (res.ok) {
      const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      return { ok: true, status: res.status, data: arr.map(normLesson) }
    }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "List lessons endpoint not found" }
}

export async function createLesson(courseId: number, input: LessonInput): Promise<Result<LessonAdmin>> {
  // Backend LessonCreateAssignView expects: course_id in request.data and fields named
  // title, content, duration, lesson_type (optional). If a video is provided, send multipart with
  // the file under key `video_file`.
  const hasFile = !!input.video_file
  let body: any
  if (hasFile) {
    const fd = new FormData()
    fd.set("title", input.title)
    fd.set("content", input.description ?? "")
  if (input.duration_min != null) fd.set("duration", String(input.duration_min))
  // lesson_type is required by backend; default to 'theory' when not provided
  fd.set("lesson_type", input.lesson_type ?? "theory")
    fd.set("course_id", String(courseId))
    fd.append("video_file", input.video_file as File, (input.video_file as File).name)
    body = fd
  } else {
    body = {
      title: input.title,
      content: input.description ?? "",
  duration: input.duration_min ?? undefined,
      // backend requires lesson_type; default to 'theory'
      lesson_type: input.lesson_type ?? "theory",
      course_id: courseId,
    }
  }
  const paths = [
    `/v1/courses/${courseId}/lessons/`,
    `/v1/teacher/courses/${courseId}/lessons/`,
    `/v1/lessons/create/`,
    `/v1/lessons/`,
  ]
  for (const p of paths) {
    const res = await api.post<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normLesson(res.data) }
    if (![404, 405, 422].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Create lesson endpoint not found" }
}

export async function updateLesson(lessonId: number, input: Partial<LessonInput>): Promise<Result<LessonAdmin>> {
  const body: any = {}
  if (input.title != null) body.title = input.title
  // map frontend `description` -> backend `content`
  if (input.description != null) body.content = input.description
  // map `duration_min` -> `duration`
  if (input.duration_min != null) body.duration = input.duration_min
  if (input.is_published != null) body.is_published = input.is_published
  if (input.lesson_type != null) body.lesson_type = input.lesson_type

  const paths = [`/v1/lessons/${lessonId}/`, `/v1/teacher/lessons/${lessonId}/`, `/v1/lessons/${lessonId}/`]
  for (const p of paths) {
    const res = await api.patch<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normLesson(res.data) }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Update lesson endpoint not found" }
}

/* ------------------------------- Exercises ------------------------------- */

export async function listExercises(lessonId: number): Promise<Result<ExerciseAdmin[]>> {
  const paths = [`/v1/lessons/${lessonId}/exercises/`, `/v1/teacher/lessons/${lessonId}/exercises/`, `/v1/exercises/`]
  for (const p of paths) {
    const res = await api.get<any>(p)
    if (res.ok) {
      const arr = Array.isArray(res.data) ? res.data : (res.data?.results ?? [])
      return { ok: true, status: res.status, data: arr.map(normExercise) }
    }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "List exercises endpoint not found" }
}

export async function createExercise(lessonId: number, input: ExerciseInput, courseId?: number): Promise<Result<ExerciseAdmin>> {
  const hasFile = !!input.reference_image
  let body: any
  if (hasFile) {
    const fd = new FormData()
    fd.set("title", input.title)
    fd.set("description", input.description)
    fd.set("lesson_id", String(lessonId))
    if (courseId != null) fd.set("course_id", String(courseId))
    fd.set("exercise_type", input.exercise_type ?? "practical")
    if (input.difficulty) fd.set("difficulty", input.difficulty)
    if (typeof input.time_estimate === "number") fd.set("time_estimate", String(input.time_estimate))
    if (input.materials) fd.set("materials", input.materials)
    if (input.instructions) fd.set("instructions", input.instructions)
    fd.append("reference_image", input.reference_image as File, (input.reference_image as File).name)
    body = fd
  } else {
    body = {
      title: input.title,
      description: input.description,
      exercise_type: input.exercise_type ?? "practical",
      difficulty: input.difficulty ?? undefined,
      time_estimate: input.time_estimate ?? undefined,
      materials: input.materials ?? undefined,
      instructions: input.instructions ?? undefined,
      lesson_id: lessonId,
      course_id: courseId ?? undefined,
    }
  }
  const paths = [
    `/v1/lessons/${lessonId}/exercises/`,
    `/v1/teacher/lessons/${lessonId}/exercises/`,
    `/v1/exercises/create/`,
    `/v1/exercises/`,
  ]
  for (const p of paths) {
    const res = await api.post<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normExercise(res.data) }
    if (![404, 405, 422].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Create exercise endpoint not found" }
}

export async function updateExercise(exerciseId: number, input: Partial<ExerciseInput>): Promise<Result<ExerciseAdmin>> {
  const body: any = {}
  if (input.title != null) body.title = input.title
  if (input.description != null) body.description = input.description
  if (input.exercise_type != null) body.exercise_type = input.exercise_type
  if (input.difficulty != null) body.difficulty = input.difficulty
  if (input.time_estimate != null) body.time_estimate = input.time_estimate
  if (input.materials != null) body.materials = input.materials
  if (input.instructions != null) body.instructions = input.instructions
  // reference_image updates would require multipart; not implemented here

  const paths = [`/v1/exercises/${exerciseId}/`, `/v1/teacher/exercises/${exerciseId}/`, `/v1/exercises/${exerciseId}/`]
  for (const p of paths) {
    const res = await api.patch<any>(p, body)
    if (res.ok) return { ok: true, status: res.status, data: normExercise(res.data) }
    if (![404, 405].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "Update exercise endpoint not found" }
}

/* --------------------------------- Upload -------------------------------- */

export async function uploadMedia(file: File): Promise<Result<{ url: string }>> {
  const fd = new FormData()
  fd.append("file", file, file.name)
  const paths = [`/v1/uploads/`, `/v1/media/`, `/v1/files/`, "/media/"]
  for (const p of paths) {
    const res = await api.post<any>(p, fd)
    if (res.ok) {
      const url = res.data?.url ?? res.data?.file_url ?? res.data?.path ?? res.data?.file ?? null
      if (url) return { ok: true, status: res.status, data: { url } }
      return { ok: true, status: res.status, data: { url: "" } }
    }
    if (![404, 405, 415].includes((res as any).status ?? res.status)) {
      return { ok: false, status: res.status, error: (res as any).error }
    }
  }
  return { ok: false, status: 404, error: "No upload endpoint" }
}
