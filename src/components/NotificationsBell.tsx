// src/components/NotificationsBell.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { getUnreadCount } from "../services/notifications";

export default function NotificationsBell() {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = React.useState<number>(0);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      if (!isAuthenticated) { setUnread(0); return; }
      const n = await getUnreadCount();
      if (mounted) setUnread(n);
    }
    load();
    const onUpdated = () => {
      // Quick refetch on any notification update
      load();
    };
    window.addEventListener("notifications:updated", onUpdated as EventListener);
    return () => { mounted = false; window.removeEventListener("notifications:updated", onUpdated as EventListener); };
  }, [isAuthenticated]);

  return (
    <button className="relative inline-flex items-center justify-center rounded-md px-3 py-2 border border-border bg-card text-card-foreground">
      <span>🔔</span>
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {unread}
        </span>
      )}
    </button>
  );
}
