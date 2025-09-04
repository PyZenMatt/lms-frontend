// src/components/ui/textarea.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  success?: boolean;
  hint?: string;
  hintId?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, success, hint, hintId, ...props }, ref) => {
    const stateClasses = invalid
      ? "border-destructive focus:border-destructive focus:ring-destructive"
      : success
      ? "border-accent focus:border-accent focus:ring-accent"
      : "border-border";

    const disabledClasses = props.disabled
      ? "bg-input-background/60 text-muted-foreground border-border/60 pointer-events-none cursor-not-allowed"
      : "text-foreground";

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          aria-invalid={invalid ? true : undefined}
          aria-describedby={hint ? hintId : undefined}
          className={cn(
            "w-full min-h-[90px] rounded-lg bg-input-background px-3 py-2 text-sm outline-none transition",
            stateClasses,
            disabledClasses,
            "focus-ring",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p
            id={hintId}
            className={cn(
              "text-xs mt-1",
              invalid ? "text-destructive-foreground" : "text-muted-foreground",
            )}
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
export default Textarea;
