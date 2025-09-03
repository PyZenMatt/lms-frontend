// src/services/student.ts
// ⛳️ Se il tuo api.ts è in src/lib/api.ts cambia la riga sotto in:  import { api } from "../lib/api";
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

type DrfPage<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type Ok<T> = { ok: true; status: number; data: T };
type Err = { ok: false; status: number; error?: any };
type Result<T> = Ok<T> | Err;

export async function getEnrolledCourses(
  page = 1,
  page_size = 10
): Promise<Result<{ items: Course[]; count: number }>> {
  const res = await api.get<Course[] | DrfPage<Course>>("/v1/student/enrolled_courses/", {
    params: { page, page_size },
  });

  if (!res.ok) return { ok: false, status: res.status, error: (res as any).error };

  const raw: any = res.data;
  const items: Course[] = Array.isArray(raw) ? raw : raw?.results ?? [];
  const count: number = Array.isArray(raw) ? items.length : raw?.count ?? items.length;

  return { ok: true, status: res.status, data: { items, count } };
}
