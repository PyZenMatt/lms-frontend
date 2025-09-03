import * as React from "react";
import { cn } from "@/lib/utils";

export type RadioOption = { value: string; label: React.ReactNode; disabled?: boolean };

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  className,
}: {
  name: string;
  value?: string;
  onChange?: (v: string) => void;
  options: RadioOption[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} role="radiogroup" aria-labelledby={name}>
      {options.map((opt) => (
        <label key={opt.value} className={cn("inline-flex items-center gap-2", opt.disabled && "opacity-60")}>
          <span
            className={cn(
              "relative inline-flex h-5 w-5 items-center justify-center rounded-full border border-border",
              "focus-within:ring-2 focus-within:ring-ring/50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={(e) => onChange?.(e.target.value)}
              className="peer absolute inset-0 cursor-pointer opacity-0"
              disabled={opt.disabled}
            />
            <span
              className={cn(
                "pointer-events-none inline-block h-2.5 w-2.5 scale-0 rounded-full bg-primary transition-transform",
                "peer-checked:scale-100"
              )}
            />
          </span>
          <span className="text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
