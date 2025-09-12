// src/components/NotificationItem.tsx
// Using automatic JSX runtime; no direct React import needed here
import { Badge } from "./ui/badge";

// Local notification type (types/notification does not export NotificationItem)
type N = {
  id: number | string;
  title?: string | null;
  message?: string | null;
  read?: boolean;
  created_at?: string | null;
  notification_type?: string;
  absorption_id?: number | null;
  decision_id?: number | null;
  // Enriched by backend for teocoin_discount_pending
  offered_teacher_teo?: string | null;
  // New: backend provides the canonical EUR amount for discounts (5/10/15)
  discount_eur?: number | null;
  // Additional structured fields from backend
  tier?: string | null;
  staking_allowed?: boolean | null;
  expires_at?: string | null;
  // optional flag that may be present to mark urgent semantics
  is_urgent?: boolean | null;
};

// Modal and inline decision panel removed - decisions managed from navbar
type Props = {
  item: N;
  onMarkRead?: (id: N["id"]) => void;
  onDelete?: (id: N["id"]) => void;
};

export default function NotificationItem({ item, onMarkRead, onDelete }: Props) {
  const isRead = !!item.read;
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
          {/* Show an explicit urgent badge when this notification represents an urgent discount */}
          {(item.notification_type === "teocoin_discount_pending_urgent" || item.is_urgent) && (
            <div className="ml-2">
              <Badge variant="destructive">Urgente</Badge>
            </div>
          )}
          {created && (
            <time className="text-xs text-muted-foreground" dateTime={created.toISOString()}>
              {created.toLocaleString()}
            </time>
          )}
        </div>
        {/* For discount notifications we always prefer structured fields.
            Hide the free-text `message` for both pending and urgent discount types. */}
        {!(item.notification_type === "teocoin_discount_pending" || item.notification_type === "teocoin_discount_pending_urgent") && item.message && (
          <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
        )}

        {(item.notification_type === "teocoin_discount_pending" || item.notification_type === "teocoin_discount_pending_urgent") && (
          <div className="mt-1">
            {item.discount_eur != null && (
              <p className="text-sm">
                Sconto: <strong>{item.discount_eur}€</strong>
              </p>
            )}
            {item.offered_teacher_teo != null && (
              <p className="mt-1 text-sm">
                TEO offerti: <span className="font-mono">{Number(item.offered_teacher_teo).toFixed(8)}</span>
              </p>
            )}
            {item.tier != null && (
              <p className="mt-1 text-sm text-muted-foreground">Tier: <span className="font-medium">{item.tier}</span></p>
            )}
            {typeof item.staking_allowed === "boolean" && (
              <p className="mt-1 text-sm text-muted-foreground">Staking consentito: {item.staking_allowed ? "Sì" : "No"}</p>
            )}
            {item.expires_at != null && (
              <p className="mt-1 text-sm text-muted-foreground">Scadenza: {new Date(item.expires_at).toLocaleString()}</p>
            )}
          </div>
        )}
        {(onMarkRead || onDelete) && (
          <div className="mt-3 flex items-center gap-2">
            {!isRead && onMarkRead && (
              <button
                onClick={() => onMarkRead(item.id)}
                className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-accent"
              >
                Segna come letta
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                aria-label="Elimina notifica"
                className="inline-flex h-8 items-center rounded-md border px-2 text-xs text-destructive hover:bg-red-50"
              >
                Elimina
              </button>
            )}
          </div>
        )}
        {/* Deep-link removed: decisions are handled via TeacherDecisionNav in the navbar */}
      </div>
    </div>
  );
}
