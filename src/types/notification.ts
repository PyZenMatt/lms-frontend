// Types for Notifications domain

export type DrfPaginated<T> = {
  results: T[];
  next?: string | null;
  previous?: string | null;
  count?: number;
}

export type NotificationItem = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  // Normalized field: use `read` across the FE. Backend may also send `is_read`.
  read?: boolean;
  created_at?: string | null;
  notification_type?: string;
  absorption_id?: number | null;
  decision_id?: number | null;
  offered_teacher_teo?: string | null;
  // Allow any additional fields from backend
  [key: string]: unknown;
}
