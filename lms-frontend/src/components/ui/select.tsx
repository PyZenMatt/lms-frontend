import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, disabled, children, ...props }, ref) => (
    <div
      className={cn(
        "relative rounded-lg border bg-[--color-input-background]",
        "focus-within:ring-2 focus-within:ring-ring/50",
        invalid ? "border-destructive/60" : "border-border",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full appearance-none bg-transparent px-3 py-2 pr-8 text-foreground outline-none",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <span
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      >
        ▾
      </span>
    </div>
  )
);
Select.displayName = "Select";
