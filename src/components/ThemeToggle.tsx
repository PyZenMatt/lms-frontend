import React from "react";

// Theme toggle disabled - using single OpenPython theme only

export default function ThemeToggle() {
  // Component disabled - show message about single theme
  return (
    <div className="px-3 py-2">
      <label className="text-xs text-muted-foreground block mb-1">Theme</label>
      <div className="flex items-center gap-2">
        <div className="rounded-md border px-2 py-1 text-sm bg-background text-foreground opacity-60">
          OpenPython (Fixed)
        </div>
        <span className="text-xs text-muted-foreground">
          Single theme mode
        </span>
      </div>
    </div>
  );
}

