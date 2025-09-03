// src/services/enrollment.ts
import { api } from "../lib/api";

export async function enrollInCourse(courseId: number | string) {
  // Tentativo 1: endpoint classico sul corso
  const r1 = await api.post(`/v1/courses/${courseId}/enroll/`, {});
  if (r1.ok) return r1;

  // Tentativo 2: endpoint resource dedicata
  const r2 = await api.post(`/v1/enrollments/`, { course: courseId });
  if (r2.ok) return r2;

  // Tentativo 3 (opzionale, abilitalo se il BE lo usa davvero)
  // const r3 = await api.post(`/v1/courses/${courseId}/enrollment/`, {});
  // if (r3.ok) return r3;

  // Ritorna l'ultimo errore informativo
  return r2.ok ? r2 : r1;
}
