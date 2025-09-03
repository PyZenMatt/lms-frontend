// src/components/ToastHost.tsx
import React from "react";

type Toast = {
  id: number;
  title?: string;
  message: string;
  variant?: "error" | "success" | "info" | "warning";
  duration?: number; // ms
};

export default function ToastHost() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  React.useEffect(() => {
    function onShow(e: Event) {
      const d = (e as CustomEvent<Omit<Toast, "id">>).detail;
      const toast: Toast = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        variant: "info",
        duration: 4000,
        ...d,
      };
      setToasts((arr) => [...arr, toast]);
      if (toast.duration && toast.duration > 0) {
        window.setTimeout(() => {
          setToasts((arr) => arr.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    }
    window.addEventListener("toast:show", onShow as EventListener);
    return () => window.removeEventListener("toast:show", onShow as EventListener);
  }, []);

  function variantClasses(v?: Toast["variant"]) {
    switch (v) {
      case "success": return "bg-emerald-600 text-white";
      case "warning": return "bg-amber-500 text-black";
      case "error":   return "bg-red-600 text-white";
      default:        return "bg-foreground text-background";
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-[101] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-full max-w-md rounded-md px-4 py-3 shadow-card ${variantClasses(t.variant)}`}
          role="status"
          aria-live="polite"
        >
          {t.title && <div className="text-sm font-semibold">{t.title}</div>}
          <div className="text-sm">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
