import { api } from "@/lib/api"

export async function listPendingCourses(params: { page?: number; page_size?: number; q?: string } = {}) {
  // Admin pending endpoint: backend exposes PendingCoursesView at /v1/pending-courses/
  const res = await api.get(`/v1/pending-courses/`, { params })
  // helpful debug in dev: show shape
  if (import.meta.env?.DEV) {
    try {
      console.info('[ADMIN] listPendingCourses called', { params, status: res.status, dataShape: Array.isArray(res.data) ? 'array' : typeof res.data })
    } catch (e) {
      // swallow logging errors in weird environments
      void e
    }
  }
  return res
}

// Deprecated compatibility wrapper: prefer `listPendingCourses`
export function listPendingTeachers(params: { page?: number; page_size?: number; q?: string } = {}) {
  // Prefer the new, clearer users/teachers path but fall back to the legacy
  // top-level pending-teachers route for backwards compatibility.
  console.info("listPendingTeachers: calling /v1/users/teachers/pending/")
  // The frontend pages expect a payload with { items: [], count: N }.
  // Backend standardized responses use { success, message, status_code, data }.
  // Normalize both new and legacy responses here so callers don't need to handle variants.
  try {
    return (async () => {
      const res = await api.get(`/v1/users/teachers/pending/`, { params });
      // If backend returned standardized wrapper: data may be under res.data.data
  const payload = (res && (res as unknown as { data?: unknown }).data) ?? null;
      // If payload is the standardized wrapper
      if (payload && typeof payload === 'object' && payload.success === true && payload.data !== undefined) {
        const inner = payload.data;
        // If inner is an array, convert to { items, count }
        if (Array.isArray(inner)) return { ok: true, status: res.status, data: { items: inner, count: inner.length } };
        if (inner && typeof inner === 'object' && (inner.items || Array.isArray(inner))) {
          return { ok: true, status: res.status, data: { items: inner.items || [], count: typeof inner.count === 'number' ? inner.count : (Array.isArray(inner.items) ? inner.items.length : 0) } };
        }
        // Fallback: wrap whatever inner is as items
        return { ok: true, status: res.status, data: { items: Array.isArray(inner) ? inner : [inner], count: Array.isArray(inner) ? inner.length : 1 } };
      }

      // If res.data is already the plain payload (legacy shape)
      if (res && (res as unknown as { data?: unknown }).data) {
        const d = (res as unknown as { data?: unknown }).data;
        if (Array.isArray(d)) return { ok: true, status: res.status, data: { items: d, count: d.length } };
        if (d && typeof d === 'object' && (d.items || Array.isArray(d.items))) {
          return { ok: true, status: res.status, data: { items: d.items || [], count: typeof d.count === 'number' ? d.count : (Array.isArray(d.items) ? d.items.length : 0) } };
        }
        // Unknown shape -> wrap
        return { ok: true, status: res.status, data: { items: Array.isArray(d) ? d : [d], count: Array.isArray(d) ? d.length : 1 } };
      }

      // If we get here, do a graceful fallback to the legacy endpoint
      throw new Error('Unexpected response shape');
  })();
  } catch (e) {
    console.warn("listPendingTeachers: fallback to /v1/pending-teachers/", e)
    // fallback: call legacy endpoint and normalize similarly
    return (async () => {
      const res = await api.get(`/v1/pending-teachers/`, { params });
      const d = (res as unknown as { data?: unknown }).data;
      if (Array.isArray(d)) return { ok: true, status: res.status, data: { items: d, count: d.length } };
      if (d && typeof d === 'object' && (d.items || Array.isArray(d.items))) {
        return { ok: true, status: res.status, data: { items: d.items || [], count: typeof d.count === 'number' ? d.count : (Array.isArray(d.items) ? d.items.length : 0) } };
      }
      return { ok: true, status: res.status, data: { items: Array.isArray(d) ? d : [d], count: Array.isArray(d) ? d.length : 1 } };
    })();
  }
}

export async function approveCourse(courseId: number) {
  const res = await api.post(`/v1/approve-course/${courseId}/`, {})
  return res
}

// Deprecated compatibility wrapper: prefer `approveCourse`
export function approveTeacher(courseId: number | string) {
  const userId = Number(courseId);
  console.info("approveTeacher: calling /v1/users/teachers/{id}/approve/")
  try {
    return api.post(`/v1/users/teachers/${userId}/approve/`, {})
  } catch (e) {
    console.warn("approveTeacher: fallback to /v1/approve-teacher/{id}/", e)
    return api.post(`/v1/approve-teacher/${userId}/`, {})
  }
}

export async function rejectTeacher(userId: number | string) {
  console.warn("DEPRECATED: rejectTeacher is deprecated; use user admin APIs explicitly")
  const res = await api.post(`/v1/reject-teacher/${userId}/`, {})
  return res
}
