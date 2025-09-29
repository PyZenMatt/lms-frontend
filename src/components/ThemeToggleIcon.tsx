import React from "react";

// Theme toggle disabled - using single OpenPython theme only

export default function ThemeToggleIcon() {
  // Component disabled - show message about single theme
  return (
    <div 
      className="text-xs text-muted-foreground opacity-60 px-2 py-1 rounded-md border" 
      title="Single theme mode - switching disabled"
    >
      🎨 OpenPython Theme
    </div>
  );
}