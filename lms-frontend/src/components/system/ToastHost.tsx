// src/components/system/ToastHost.tsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant?: "info" | "success" | "warning" | "error";
  durationMs?: number;
};

const VARIANT_STYLES: Record<NonNullable<Toast["variant"]>, string> = {
  info: "bg-neutral-900 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-black",
  error: "bg-red-600 text-white",
};

function useWindowToastEvents(onPush: (t: Toast) => void) {
  useEffect(() => {
    function handler(e: Event) {
      const ev = e as CustomEvent<Partial<Toast>>;
      const payload = ev.detail || {};
      onPush({
        id: crypto.randomUUID(),
        message: payload.message || "",
        title: payload.title,
        variant: payload.variant ?? "info",
        durationMs: payload.durationMs ?? 3500,
      });
    }
    window.addEventListener("toast:show" as any, handler);
    return () => window.removeEventListener("toast:show" as any, handler);
  }, [onPush]);
}

export default function ToastHost() {
  const [items, setItems] = useState<Toast[]>([]);

  useWindowToastEvents((t) => {
    setItems((prev) => [...prev, t]);
    window.setTimeout(
      () => setItems((prev) => prev.filter((x) => x.id !== t.id)),
      t.durationMs
    );
  });

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[10000] flex w-full max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10",
            VARIANT_STYLES[t.variant ?? "info"]
          )}
          role="status"
          aria-live="polite"
        >
          <div className="p-3">
            {t.title ? <div className="text-sm font-semibold">{t.title}</div> : null}
            <div className="text-sm opacity-90">{t.message}</div>
          </div>
        </div>
      ))}
    </div>,
    document.body
  );
}
