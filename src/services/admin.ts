// src/services/admin.ts
import { api } from "../api";

export type PendingTeacher = {
  id: number | string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
  applied_at?: string;
};

type AnyList =
  | PendingTeacher[]
  | {
      count?: number;
      next?: string | null;
      previous?: string | null;
      results?: PendingTeacher[];
      pending?: PendingTeacher[];
      pending_teachers?: PendingTeacher[];
      data?: PendingTeacher[] | { items?: PendingTeacher[] };
      items?: PendingTeacher[];
    };

function toArray(data: AnyList | undefined): PendingTeacher[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  const o: any = data;
  return (
    o.results ||
    o.pending ||
    o.pending_teachers ||
    o.items ||
    (Array.isArray(o.data) ? o.data : o.data?.items) ||
    []
  );
}

/** GET /api/v1/pending-teachers/ */
export async function listPendingTeachers(opts?: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  const qs = new URLSearchParams();
  if (opts?.page) qs.set("page", String(opts.page));
  if (opts?.page_size) qs.set("page_size", String(opts.page_size));
  if (opts?.search) qs.set("search", opts.search);
  const path = "/v1/pending-teachers/" + (qs.toString() ? `?${qs}` : "");

  const res = await api.get<AnyList>(path);
  if (!res.ok) throw new Error(`Errore ${res.status} nel caricamento docenti in attesa`);

  const items = toArray(res.data);
  const meta: any = Array.isArray(res.data) ? {} : res.data || {};
  const count: number = typeof meta.count === "number" ? meta.count : items.length;
  return { items, count, next: meta.next ?? null, previous: meta.previous ?? null };
}

/** POST /api/v1/approve-teacher/<user_id>/ */
export async function approveTeacher(userId: number | string) {
  const res = await api.post(`/v1/approve-teacher/${userId}/`, {});
  if (!res.ok) throw new Error(`Errore ${res.status} durante l'approvazione`);
  return true;
}

/** POST /api/v1/reject-teacher/<user_id>/ */
export async function rejectTeacher(userId: number | string) {
  const res = await api.post(`/v1/reject-teacher/${userId}/`, {});
  if (!res.ok) throw new Error(`Errore ${res.status} durante il rifiuto`);
  return true;
}
