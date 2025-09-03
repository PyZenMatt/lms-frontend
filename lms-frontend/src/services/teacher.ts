// src/services/teacher.ts
import { api } from "../lib/api";

export type Course = {
  id: number;
  title: string;
  description?: string;
  cover_image?: string;
  cover_url?: string;
  price_eur?: number | null;
  created_at?: string;
};

export type TeacherStats = Partial<{
  total_courses: number;
  total_students: number;
  avg_price_eur: number;
  pending_courses: number;
}>;

type DrfPage<T> = { count: number; next?: string | null; previous?: string | null; results: T[] };

export async function getTeacherDashboard(page = 1, page_size = 10) {
  const res = await api.get<any>("/v1/dashboard/teacher/", { params: { page, page_size } });

  if (!res.ok) {
    return {
      ok: false as const,
      status: res.status,
      data: { courses: [] as Course[], count: 0, stats: undefined as TeacherStats | undefined },
    };
  }

  const raw = res.data;
  let courses: Course[] = [];
  let count = 0;
  let stats: TeacherStats | undefined;

  if (raw && typeof raw === "object" && Array.isArray((raw as DrfPage<Course>).results)) {
    courses = (raw as DrfPage<Course>).results;
    count = typeof (raw as DrfPage<Course>).count === "number" ? (raw as DrfPage<Course>).count : courses.length;
    stats = (raw as any).stats ?? (raw as any).metrics;
  } else if (raw && typeof raw === "object" && (raw as any).courses !== undefined) {
    const c = (raw as any).courses;
    if (Array.isArray(c)) {
      courses = c;
      count = c.length;
    } else if (c && typeof c === "object" && Array.isArray(c.results)) {
      courses = c.results;
      count = typeof c.count === "number" ? c.count : c.results.length;
    }
    stats = (raw as any).stats ?? (raw as any).metrics;
  } else if (Array.isArray(raw)) {
    courses = raw as Course[];
    count = courses.length;
  } else {
    const maybe = (raw as any)?.data ?? (raw as any)?.results ?? [];
    if (Array.isArray(maybe)) {
      courses = maybe;
      count = maybe.length;
    }
    stats = (raw as any)?.stats ?? (raw as any)?.metrics;
  }

  return { ok: true as const, status: res.status, data: { courses, count, stats } };
}
