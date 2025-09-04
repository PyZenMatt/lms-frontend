// src/components/NotificationsBell.tsx
import React from "react";
import { useAuth } from "../context/AuthContext";
import { API } from "../lib/config";
import { getAccessToken } from "../lib/auth";

export default function NotificationsBell() {
  const { isAuthenticated } = useAuth();
  const [unread, setUnread] = React.useState<number>(0);

  React.useEffect(() => {
    let abort = false;
    async function run() {
      if (!isAuthenticated) { setUnread(0); return; }
      const access = getAccessToken();
      if (!access) { setUnread(0); return; }
      try {
        const res = await fetch(API.notifications.unreadCount, {
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!abort) {
          if (res.ok) {
            const data = await res.json();
            setUnread(Number(data?.unread ?? data?.count ?? 0));
          } else {
            // 401/403/altro → degradare a 0 senza rumore
            setUnread(0);
          }
        }
      } catch {
        if (!abort) setUnread(0);
      }
    }
    run();
    return () => { abort = true; };
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
