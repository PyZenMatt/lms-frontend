// src/components/ui/alert.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";
const vmap: Record<Variant, string> = {
  info: "border-border bg-card text-foreground dark:border-border dark:bg-card/80 dark:text-foreground",
  success: "border-emerald-300/60 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200",
  warning: "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100",
  error: "border-red-300/70 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100",
};

export function Alert({
  title,
  children,
  variant = "info",
  className,
}: {
  title?: string;
  children?: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border p-4 text-sm border-border bg-card shadow-card", vmap[variant], className)} role="status">
      {title ? <div className="mb-1 font-medium">{title}</div> : null}
      <p className="text-foreground/80">{children}</p>
    </div>
  );
}
export default Alert;
