import { useEffect, useState } from "react";
import { getEnrolledCourses } from "@/services/student";
import { getCourseOutline } from "@/services/courses";
import { listCourseLessons } from "@/services/exercises";
import { listAssignedReviews } from "@/services/reviews";
import { getDbWallet } from "@/services/wallet";

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

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [coursesRes, reviewsRes, walletRes] = await Promise.all([
          getEnrolledCourses(1, 100),
          listAssignedReviews(),
          getDbWallet(),
        ]);

        const activeCourses = coursesRes.ok ? (coursesRes.data.count ?? coursesRes.data.items.length) : 0;
        const pendingReviews = reviewsRes.ok ? reviewsRes.data.length : 0;
        // reviewsGiven not provided by backend; approximate with length of history if available
        const reviewsGiven = 0;
        const teoBalance = walletRes.ok ? walletRes.data.balance_teo ?? 0 : 0;

        const creatorTokensLabel = `${Number.isFinite(teoBalance) ? Math.round(teoBalance) : 0} Creator Tokens`;

        // map enrolled courses into a small UI-friendly shape
        const rawEnrolled = coursesRes.ok ? (coursesRes.data.items ?? []) : [];
        const enrolledCoursesInitial = rawEnrolled.map((c: any) => {
          const id = String(c.id ?? c.course_id ?? c.pk ?? "");
          const title = (c.title ?? c.name ?? "Untitled") as string;
          const description = (c.description ?? undefined) as string | undefined;
          const thumbnail = (c.cover_url ?? c.cover_image ?? c.thumbnail ?? undefined) as string | undefined;
          const progressPercent = typeof c.progress === 'number' ? c.progress : (typeof c.progress_percent === 'number' ? c.progress_percent : undefined);
          // initial conservative values; we'll attempt to replace them by fetching the outline
          const lessonsTotal = typeof c.lessons_count === 'number' ? c.lessons_count : (typeof c.lessons === 'number' ? c.lessons : (typeof c.total_lessons === 'number' ? c.total_lessons : 10));
          const lessonsCompleted = typeof c.completed_lessons === 'number' ? c.completed_lessons : (typeof progressPercent === 'number' ? Math.round((progressPercent / 100) * lessonsTotal) : 0);
          return { id, title, description, thumbnail, progressPercent, lessonsTotal, lessonsCompleted };
        });

        // enrich each enrolled course with real outline/progress data when possible
        const enriched = await Promise.all(
          enrolledCoursesInitial.map(async (course) => {
            try {
              const courseIdNum = Number(course.id);
              if (Number.isFinite(courseIdNum) && courseIdNum > 0) {
                const outlineRes = await getCourseOutline(courseIdNum);
                if (outlineRes.ok && outlineRes.data) {
                  const payload = outlineRes.data;
                  const lessons = Array.isArray(payload.lessons) ? payload.lessons : [];
                  const total = lessons.length > 0 ? lessons.length : course.lessonsTotal ?? 10;
                  const completedIds = Array.isArray(payload.progress?.completed_lesson_ids) ? payload.progress.completed_lesson_ids : [];
                  const completed = completedIds.length;
                  const percent = typeof payload.progress?.percent === 'number' ? Math.round(payload.progress.percent) : (total > 0 ? Math.round((completed / total) * 100) : course.progressPercent ?? 0);
                  return { ...course, lessonsTotal: total, lessonsCompleted: completed, progressPercent: percent };
                }
                // fallback to listing lessons if outline endpoint unavailable
                const lessonsList = await listCourseLessons(courseIdNum);
                if (lessonsList.ok) {
                  const total = lessonsList.data.length;
                  const completed = typeof course.progressPercent === 'number' ? Math.round((course.progressPercent / 100) * total) : course.lessonsCompleted ?? 0;
                  const percent = total > 0 ? Math.round((completed / total) * 100) : course.progressPercent ?? 0;
                  return { ...course, lessonsTotal: total, lessonsCompleted: completed, progressPercent: percent };
                }
              }
            } catch (err) {
              // ignore per-course failures and keep initial conservative values
              console.debug("Failed to enrich course outline", course.id, err);
            }
            return course;
          })
        );

        const enrolledCourses = enriched;

  if (!mounted) return;
  setStats({ activeCourses, pendingReviews, reviewsGiven, teoBalance: teoBalance ?? 0, creatorTokensLabel, enrolledCourses });
        setError(null);
      } catch (e: any) {
        if (!mounted) return;
        setError(String(e?.message ?? e ?? "Error"));
        setStats({ activeCourses: 0, pendingReviews: 0, reviewsGiven: 0, teoBalance: 0, creatorTokensLabel: "0 Creator Tokens" });
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { stats, loading, error } as const;
}
