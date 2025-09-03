import * as React from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & { label?: React.ReactNode };

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, disabled, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center gap-2", disabled && "opacity-60")}>
        <span
          className={cn(
            "relative inline-flex h-5 w-5 items-center justify-center rounded-md border transition",
            "bg-background text-background",
            "focus-within:ring-2 focus-within:ring-ring/50",
            "border-border"
          )}
        >
          <input
            ref={ref}
            type="checkbox"
            className="peer absolute inset-0 cursor-pointer opacity-0"
            disabled={disabled}
            {...props}
          />
          <span
            className={cn(
              "pointer-events-none inline-block h-3 w-3 scale-0 rounded-sm bg-primary transition-transform",
              "peer-checked:scale-100"
            )}
          />
        </span>
        {label && <span className={cn("text-sm", className)}>{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
