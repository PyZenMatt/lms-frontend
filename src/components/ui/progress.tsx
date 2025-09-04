import * as React from "react";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, max = 100, className }:{
  value?: number; max?: number; className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={cn("h-2 w-full rounded-md bg-muted", className)}>
      <div
        className="h-full rounded-md bg-primary transition-all"
        style={{ width: `${pct}%` }}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(pct)}
        role="progressbar"
      />
    </div>
  );
}
