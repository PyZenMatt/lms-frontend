import { useEffect, useState } from "react";
import { useEnrolledCourses } from '@/hooks/useEnrolledCourses'
import { getCourseOutline } from "@/services/courses";
import { listCourseLessons } from "@/services/exercises";
import { listAssignedReviews } from "@/services/reviews";

export type DashboardStats = {
  activeCourses: number;
  pendingReviews: number;
  reviewsGiven: number;
  teoBalance: number;
  creatorTokensLabel: string; // friendly label
  enrolledCourses?: Array<{
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    progressPercent?: number | undefined;
    lessonsTotal: number;
    lessonsCompleted: number;
  }>;
};

export default function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enrolledQuery = useEnrolledCourses(1, 100)
  // enrichment flag removed; keep simple loading state

  useEffect(() => {
    let mounted = true
    async function enrich() {
      if (!enrolledQuery.data) {
        if (mounted) setLoading(false)
        return
      }
      if (mounted) setLoading(true)
  // enrichment started
      try {
  const rawEnrolled = enrolledQuery.data?.items ?? []
        const enrolledCoursesInitial = rawEnrolled.map((c: unknown) => {
          const ci = c as any
          const id = String(ci.id ?? ci.course_id ?? ci.pk ?? "")
          const title = (ci.title ?? ci.name ?? "Untitled") as string
          const description = (ci.description ?? undefined) as string | undefined
          const thumbnail = (ci.cover_url ?? ci.cover_image ?? ci.thumbnail ?? undefined) as string | undefined
          const progressPercent = typeof ci.progress === 'number' ? ci.progress : (typeof ci.progress_percent === 'number' ? ci.progress_percent : undefined)
          const lessonsTotal = typeof ci.lessons_count === 'number' ? ci.lessons_count : (typeof ci.lessons === 'number' ? ci.lessons : (typeof ci.total_lessons === 'number' ? ci.total_lessons : 10))
          const lessonsCompleted = typeof ci.completed_lessons === 'number' ? ci.completed_lessons : (typeof progressPercent === 'number' ? Math.round((progressPercent / 100) * lessonsTotal) : 0)
          return { id, title, description, thumbnail, progressPercent, lessonsTotal, lessonsCompleted }
        })

        const enriched = await Promise.all(
          enrolledCoursesInitial.map(async (course) => {
            try {
              const courseIdNum = Number(course.id)
              if (Number.isFinite(courseIdNum) && courseIdNum > 0) {
                const outlineRes = await getCourseOutline(courseIdNum)
                if (outlineRes.ok && outlineRes.data) {
                  const payload = outlineRes.data
                  const lessons = Array.isArray(payload.lessons) ? payload.lessons : []
                  const total = lessons.length > 0 ? lessons.length : course.lessonsTotal ?? 10
                  const completedIds = Array.isArray(payload.progress?.completed_lesson_ids) ? payload.progress.completed_lesson_ids : []
                  const completed = completedIds.length
                  const percent = typeof payload.progress?.percent === 'number' ? Math.round(payload.progress.percent) : (total > 0 ? Math.round((completed / total) * 100) : course.progressPercent ?? 0)
                  return { ...course, lessonsTotal: total, lessonsCompleted: completed, progressPercent: percent }
                }
                const lessonsList = await listCourseLessons(courseIdNum)
                if (lessonsList.ok) {
                  const total = lessonsList.data.length
                  const completed = typeof course.progressPercent === 'number' ? Math.round((course.progressPercent / 100) * total) : course.lessonsCompleted ?? 0
                  const percent = total > 0 ? Math.round((completed / total) * 100) : course.progressPercent ?? 0
                  return { ...course, lessonsTotal: total, lessonsCompleted: completed, progressPercent: percent }
                }
              }
            } catch (err) {
              console.debug('Failed to enrich course outline', course.id, err)
            }
            return course
          })
        )

  if (!mounted) return
  const activeCourses = enrolledQuery.isSuccess ? (enrolledQuery.data?.count ?? (enrolledQuery.data?.items.length ?? 0)) : 0
        const pendingReviews = 0
        const reviewsGiven = 0
        const teoBalance = 0
        const creatorTokensLabel = `${Number.isFinite(teoBalance) ? Math.round(teoBalance) : 0} Creator Tokens`
        setStats({ activeCourses, pendingReviews, reviewsGiven, teoBalance: teoBalance ?? 0, creatorTokensLabel, enrolledCourses: enriched })
        setError(null)
      } catch (e: unknown) {
        if (!mounted) return
        setError(String((e as Error)?.message ?? String(e ?? 'Error')))
        setStats({ activeCourses: 0, pendingReviews: 0, reviewsGiven: 0, teoBalance: 0, creatorTokensLabel: '0 Creator Tokens' })
      } finally {
        if (mounted) setLoading(false)
      }
    }
    enrich()
    return () => { mounted = false }
  }, [enrolledQuery.data, enrolledQuery.isSuccess])

  return { stats, loading, error } as const;
}
