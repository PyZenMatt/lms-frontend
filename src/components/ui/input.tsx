import * as React from "react";
import { Input as FigmaInput } from "./input-figma-adapter";
import { cn } from "./utils";

export type InputProps = React.ComponentProps<typeof FigmaInput> & {
  invalid?: boolean;
  success?: boolean;
  hintId?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, success, hintId, ...props }, ref) {
    const stateClasses = invalid
      ? "border-destructive focus:border-destructive focus:ring-destructive aria-invalid:text-foreground"
      : success
      ? "border-accent focus:border-accent focus:ring-accent"
      : "border-border";

    const disabledClasses = props.disabled
      ? "bg-input-background/60 text-muted-foreground border-border/60 pointer-events-none cursor-not-allowed"
      : "";

    // Force input background and foreground for the login/signup inputs per design
    const inputStyle = {
      backgroundColor: '#2e3d49', // dark background
      color: '#f1eee5', // light/ivory text
      ...(props.style || {}),
    } as React.CSSProperties;

    return (
      <FigmaInput
        ref={ref}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={hintId}
        className={cn(
          "focus-ring rounded-lg placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground transition-[color,box-shadow]",
          stateClasses,
          disabledClasses,
          className,
        )}
        style={inputStyle}
        {...props}
      />
    );
  }
);
export default Input;
