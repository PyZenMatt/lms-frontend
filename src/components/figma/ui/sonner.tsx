"use client";

import { Toaster as Sonner } from "sonner";
import type { ToasterProps } from "sonner";

const Toaster = (props: ToasterProps) => {
  // App uses a single enforced theme; keep toaster in 'dark' mode to match UI
  const theme: ToasterProps["theme"] = "dark";

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
