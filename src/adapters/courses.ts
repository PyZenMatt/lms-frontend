export type CourseCardVM = {
  id: string
  title: string
  description?: string
  instructor?: string
  instructorAvatar?: string
  thumbnail?: string
  level?: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  lessons?: number
  students?: number
  rating?: number
  reviews?: number
  price?: number
  tokens?: number
  category?: string
  tags?: string[]
  enrolled?: boolean
  progress?: number
  featured?: boolean
}

// Normalizes various backend DTO shapes into a stable view model for course cards.
import CourseDTOSchema from '@/schemas/course'

export function toCourseCardVM(dto: Record<string, unknown>): CourseCardVM {
  // Validate and coerce using schema when available; fall back to raw DTO if parsing fails.
  const parsed = CourseDTOSchema.safeParse(dto)
  const d = parsed.success ? parsed.data as Record<string, unknown> : dto as Record<string, unknown>
  const idRaw = d.id ?? d.course_id
  const id = typeof idRaw === 'string' ? idRaw : (typeof idRaw === 'number' ? String(idRaw) : '')
  const title = (d.course_title ?? d.title ?? d.name ?? '') as string
  const description = (d.description ?? '') as string
  const instructor = (d.instructor ?? d.instructor_name ?? '') as string
  const instructorAvatar = (d.instructor_avatar ?? d.instructorAvatar ?? '') as string
  const thumbnail = (d.cover_url ?? d.cover_image ?? d.thumbnail ?? d.image ?? '') as string
  const level = (d['level'] === 'beginner' || d['level'] === 'intermediate' || d['level'] === 'advanced') ? (d['level'] as 'beginner' | 'intermediate' | 'advanced') : undefined
  const lessons = typeof d['lessons_count'] === 'number' ? d['lessons_count'] as number : (typeof d['lessons'] === 'number' ? d['lessons'] as number : undefined)
  const students = typeof d['students_count'] === 'number' ? d['students_count'] as number : (typeof d['students'] === 'number' ? d['students'] as number : undefined)
  const rating = typeof d['rating'] === 'number' ? d['rating'] as number : undefined
  const reviews = typeof d['reviews'] === 'number' ? d['reviews'] as number : undefined

  // price normalization: try several keys and coerce strings to numbers
  const tryNum = (k: string) => {
    const v = d[k]
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const p = parseFloat((v as string).replace(',', '.'))
      return Number.isFinite(p) ? p : undefined
    }
    if (typeof v === 'object' && v !== null) {
      const vo = v as Record<string, unknown>
      const maybe = (vo['price'] ?? vo['value'] ?? vo['amount']) as unknown
      if (typeof maybe === 'number') return maybe
      if (typeof maybe === 'string') {
        const p = parseFloat((maybe as string).replace(',', '.'))
        return Number.isFinite(p) ? p : undefined
      }
    }
    return undefined
  }

  const price = tryNum('price') ?? tryNum('price_eur') ?? tryNum('student_pay_eur') ?? tryNum('course_price') ?? undefined
  const tokens = typeof d['tokens'] === 'number' ? d['tokens'] as number : (typeof d['price_tokens'] === 'number' ? d['price_tokens'] as number : undefined)
  const category = String(d['category'] ?? d['category_name'] ?? '')
  const tags = Array.isArray(d['tags']) ? (d['tags'] as string[]) : undefined
  const enrolled = Boolean(d['enrolled'] ?? d['is_enrolled'])
  const progress = typeof d['progress_percent'] === 'number' ? d['progress_percent'] as number : (typeof d['progress'] === 'number' ? d['progress'] as number : undefined)
  const featured = Boolean(d['featured'])

  return { id, title, description, instructor, instructorAvatar, thumbnail, level, duration: (d.duration as string) ?? undefined, lessons, students, rating, reviews, price, tokens, category, tags, enrolled, progress, featured }
}

export default { toCourseCardVM }
