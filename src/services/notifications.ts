// src/services/notifications.ts
import { api } from "../lib/api";
import type { NotificationItem, DrfPaginated } from "../types/notification";

export type ListResponse = {
  ok: boolean;
  status: number;
  data: NotificationItem[];
  next?: string | null;
  previous?: string | null;
  count?: number;
};

type AnyList =
  | NotificationItem[]
  | DrfPaginated<NotificationItem>
  | { data?: NotificationItem[] | DrfPaginated<NotificationItem> }
  | { results?: NotificationItem[]; next?: string | null; previous?: string | null; count?: number };

function normalizeList(payload: AnyList): ListResponse {
  // array semplice
  if (Array.isArray(payload)) {
    return { ok: true, status: 200, data: payload, next: null, previous: null, count: payload.length };
  }
  // oggetto
  if (payload && typeof payload === "object") {
    const maybeWrapped = payload as { data?: NotificationItem[] | DrfPaginated<NotificationItem> };
    if (Array.isArray(maybeWrapped?.data)) {
      const arr = maybeWrapped.data as NotificationItem[];
      return { ok: true, status: 200, data: arr, next: null, previous: null, count: arr.length };
    }
    if (maybeWrapped && maybeWrapped.data && typeof maybeWrapped.data === "object") {
      const inner = maybeWrapped.data as DrfPaginated<NotificationItem>;
      if (Array.isArray(inner.results)) {
        return {
          ok: true,
          status: 200,
          data: inner.results,
          next: inner.next ?? null,
          previous: inner.previous ?? null,
          count: typeof inner.count === "number" ? inner.count : inner.results.length,
        };
      }
    }
    const maybePaginated = payload as { results?: NotificationItem[]; next?: string | null; previous?: string | null; count?: number };
    if (Array.isArray(maybePaginated.results)) {
      return {
        ok: true,
        status: 200,
    data: maybePaginated.results,
    next: maybePaginated.next ?? null,
    previous: maybePaginated.previous ?? null,
    count: typeof maybePaginated.count === "number" ? maybePaginated.count : maybePaginated.results.length,
      };
    }
  }
  return { ok: true, status: 200, data: [], next: null, previous: null, count: 0 };
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get<number | { count?: number; unread_count?: number; unread?: number }>("/v1/notifications/unread-count/");
  if (!res.ok) return 0;
  const d = res.data as number | { count?: number; unread_count?: number; unread?: number } | undefined;
  if (typeof d === "number") return d;
  if (typeof d?.unread === "number") return d.unread;
  if (typeof d?.count === "number") return d.count;
  if (typeof d?.unread_count === "number") return d.unread_count;
  return 0;
}

export async function getNotifications(query?: { page?: number; page_size?: number }) {
  const res = await api.get<AnyList>("/v1/notifications/", { params: query });
  if (!res.ok) return { ok: false as const, status: res.status, data: [] as NotificationItem[] } as ListResponse;
  const norm = normalizeList((res.data ?? []) as AnyList);
  // One-time raw debug to help diagnose missing decision ids
  try {
    if (typeof window !== "undefined") {
      const w = window as unknown as { __notif_raw_logged?: boolean };
      if (!w.__notif_raw_logged) {
        console.debug("[notifications.getNotifications] raw sample", (norm.data || [])[0]);
        w.__notif_raw_logged = true;
      }
    }
  } catch {
    // ignore logging errors
  }

  // Map decision_id fallback for teocoin_discount_pending
  // Normalize read/is_read -> read and apply decision_id fallback
  const mapped = (norm.data as NotificationItem[]).map((rawItem) => {
    const raw = rawItem as Record<string, unknown>;
    const item: NotificationItem = { ...rawItem };
    // Backend may send `is_read` or `read`. Prefer `read`.
    if (item.read === undefined && typeof raw["is_read"] === "boolean") {
      item.read = raw["is_read"] as boolean;
    }
    // decision id fallback
    if (item.notification_type === "teocoin_discount_pending" && (item.decision_id === undefined || item.decision_id === null)) {
      const typ = (raw["related_object_type"] || raw["related_type"] || raw["relatedModel"]) as string | undefined;
      const isDecision = typeof typ === "string" && typ.includes("TeacherDiscountDecision");
      const relId = raw["related_object_id"] as unknown;
      if (isDecision && typeof relId === "number") {
        item.decision_id = relId as number;
      }
    }
    return item;
  });
  return { ...norm, data: mapped } as ListResponse;
}

export async function acceptDecision(decisionId: number) {
  // Use server-side action to trigger business logic (ledger, decided_at, etc.)
  const path = `/api/v1/teacher-choices/${decisionId}/accept/`;
  console.debug("[notifications.acceptDecision] POST", { decisionId, path });
  const res = await api.post(path);
  try {
    // Immediately verify state server-side; useful to spot ID/prefix issues
  const verify = await api.get(`/api/v1/teacher-choices/${decisionId}/`);
    console.debug("[notifications.acceptDecision] GET verify after POST", { status: verify.status, data: verify.data });
  } catch (e) {
    console.warn("[notifications.acceptDecision] verify GET failed", e);
  }
  return res;
}

export async function declineDecision(decisionId: number) {
  // Use server-side action to trigger business logic (ledger, decided_at, etc.)
  const path = `/api/v1/teacher-choices/${decisionId}/decline/`;
  console.debug("[notifications.declineDecision] POST", { decisionId, path });
  const res = await api.post(path);
  try {
  const verify = await api.get(`/api/v1/teacher-choices/${decisionId}/`);
    console.debug("[notifications.declineDecision] GET verify after POST", { status: verify.status, data: verify.data });
  } catch (e) {
    console.warn("[notifications.declineDecision] verify GET failed", e);
  }
  return res;
}

/**
 * Backend: PATCH /notifications/{id}/read/
 * Frontend (con API_BASE_URL=http://127.0.0.1:8000/api): PATCH /v1/notifications/{id}/read/
 */
export async function markNotificationRead(id: number | string) {
  // Corpo come da tua implementazione: { read: true }
  const res = await api.patch(`/v1/notifications/${id}/read/`, { read: true });
  // Notify local subscribers so UI can update (bell, lists)
  if (res.ok) notifyUpdated();
  return res;
}

/**
 * (Opzionale) Se esiste un endpoint per "tutte lette", puoi adattarlo qui.
 * In assenza di specifica certa lo lasciamo disabilitato.
 */
export async function markAllNotificationsRead() {
  // Backend: POST /v1/notifications/mark-all-read/
  try {
    const res = await api.post(`/v1/notifications/mark-all-read/`);
    if (res.ok) {
      notifyUpdated();
    }
    return res;
  } catch (e) {
    return { ok: false as const, status: 500, error: e } as any;
  }
}

export async function deleteNotification(id: number | string) {
  try {
    const res = await api.delete(`/v1/notifications/${id}/`);
    if (res.ok) notifyUpdated();
    return res;
  } catch (e) {
    return { ok: false as const, status: 500, error: e } as any;
  }
}

export async function clearAllNotifications() {
  try {
    const res = await api.delete(`/v1/notifications/clear-all/`);
    if (res.ok) notifyUpdated();
    return res;
  } catch (e) {
    return { ok: false as const, status: 500, error: e } as any;
  }
}

// Notifica globale per aggiornare il badge nella navbar
export function notifyUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notifications:updated"));
  }
}

// Helper: read single teacher-choice for diagnostics/UI reconciliation
export async function getTeacherChoice(decisionId: number) {
  return api.get(`/api/v1/teacher-choices/${decisionId}/`);
}

// List pending teacher choices (raw response). Frontend will interpret .data
export async function getTeacherChoicesPending(params?: Record<string, unknown>) {
  return api.get(`/api/v1/teacher-choices/pending/`, { params });
}

// Optional count endpoint used for navbar badge. Fallback to 0 on errors.
export async function getTeacherChoicesPendingCount(): Promise<number> {
  try {
    // Backend exposes /pending/ which returns { success, pending_requests, count }
  const res = await api.get<any>(`/api/v1/teacher-choices/pending/`);
    if (!res.ok) return 0;
    const d = res.data as any;
    if (!d) return 0;
    if (typeof d.count === "number") return d.count;
    if (Array.isArray(d.pending_requests)) return d.pending_requests.length;
    // Last resort: if backend returned an array directly
    if (Array.isArray(d)) return d.length;
    return 0;
  } catch {
    return 0;
  }
}
