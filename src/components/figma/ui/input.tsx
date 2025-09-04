import * as React from "react";

import { cn } from "./utils";

type FigmaInputProps = React.ComponentProps<"input"> & {
  invalid?: boolean;
  success?: boolean;
  hintId?: string;
};

const Input = React.forwardRef<HTMLInputElement, FigmaInputProps>(
  ({ className, type, invalid, success, hintId, ...props }, ref) => {
    const stateClasses = invalid
      ? "aria-invalid:border-destructive aria-invalid:ring-destructive"
      : success
      ? "border-accent focus:border-accent"
      : "border-input";

    const disabledClasses = props.disabled
      ? "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 bg-input-background/60 text-muted-foreground border-border/60"
      : "";

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={hintId}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 flex h-9 w-full min-w-0 rounded-md px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          stateClasses,
          disabledClasses,
          className,
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
