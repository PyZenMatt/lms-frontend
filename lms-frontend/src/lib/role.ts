import { api } from "./api";

/** Prova a dedurre il ruolo da /v1/dashboard/role/ con fallback. */
export async function fetchServerRole():
  Promise<"student" | "teacher" | "admin" | null> {
  const r = await api.get<any>("/v1/dashboard/role/");
  if (!r.ok || !r.data) return null;

  const d = r.data as any;
  if (typeof d.role === "string") return d.role as any;
  if (d.is_admin) return "admin";
  if (d.is_teacher) return "teacher";
  if (d.is_student) return "student";
  return null;
}
