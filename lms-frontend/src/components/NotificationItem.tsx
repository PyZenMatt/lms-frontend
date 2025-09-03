// src/components/NotificationItem.tsx
// Using automatic JSX runtime; no direct React import needed here
import { Badge } from "./ui/badge";

// Local notification type (types/notification does not export NotificationItem)
type N = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  is_read?: boolean;
  created_at?: string | null;
  notification_type?: string;
  absorption_id?: number | null;
  decision_id?: number | null;
  // Enriched by backend for teocoin_discount_pending
  offered_teacher_teo?: string | null;
};

// Modal and inline decision panel removed - decisions managed from navbar
type Props = {
  item: N;
  onMarkRead?: (id: N["id"]) => void;
};

export default function NotificationItem({ item, onMarkRead }: Props) {
  const isRead = !!item.is_read;
  const created = item.created_at ? new Date(item.created_at) : null;
  // decision ids will be handled by the TeacherDecisionNav in the navbar

  return (
    <div className="flex items-start gap-3 rounded-md border p-4">
      <div className="mt-1">
        <Badge variant={isRead ? "muted" : "default"} className="h-2 w-2 p-0" />
      </div>
      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">{item.title}</h3>
          {created && (
            <time className="text-xs text-muted-foreground" dateTime={created.toISOString()}>
              {created.toLocaleString()}
            </time>
          )}
        </div>
        {item.message && <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>}
        {item.notification_type === "teocoin_discount_pending" && item.offered_teacher_teo && (
          <p className="mt-1 text-sm">
            TEO offerti: <span className="font-mono">{item.offered_teacher_teo}</span>
          </p>
        )}
        {!isRead && onMarkRead && (
          <div className="mt-3">
            <button
              onClick={() => onMarkRead(item.id)}
              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-accent"
            >
              Segna come letta
            </button>
          </div>
        )}
  {/* Deep-link removed: decisions are handled via TeacherDecisionNav in the navbar */}
      </div>
    </div>
  );
}
