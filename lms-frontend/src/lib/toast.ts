// src/lib/toast.ts
// Small helper to expose a project-wide showToast function that dispatches a DOM event
// The ToastHost listens for this event and displays toasts. This keeps the ToastHost
// implementation separated from consumers to avoid Fast Refresh warnings when the
// component file exports helpers.

export type ToastOptions = {
  title?: string;
  message: string;
  variant?: "error" | "success" | "info" | "warning";
  duration?: number;
};

export function showToast(opts: ToastOptions) {
  try {
    window.dispatchEvent(new CustomEvent("toast:show", { detail: opts }));
  } catch {
    // noop in non-browser contexts; keep silent
  }
}
