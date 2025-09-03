// src/components/ui/empty-state.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title = "Nessun dato",
  description = "Non c'è nulla da mostrare qui.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border p-8 text-center",
        "border-dashed border-border dark:border-border",
        className
      )}
    >
      <div className="text-base font-medium">{title}</div>
  <div className="text-sm text-muted-foreground dark:text-muted-foreground">{description}</div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
export default EmptyState;
