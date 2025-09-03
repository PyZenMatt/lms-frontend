import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = {
  checked?: boolean;
  onCheckedChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  className?: string;
};

export function Switch({ checked, onCheckedChange, disabled, label, className }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "inline-flex items-center gap-2",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <span
        className={cn(
          "relative h-6 w-10 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-[--color-switch-background]"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-y-1/2 transform rounded-full bg-background shadow transition-all",
            checked ? "left-[22px]" : "left-[2px]"
          )}
        />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </button>
  );
}
