import React from "react";
import { Button } from "@/components/figma/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/figma/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

const THEME_KEY = "theme" as const; // 'dark' | 'light' | 'system'

function applyTheme(mode: "system" | "dark" | "light") {
  try {
    const root = document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else if (mode === "light") {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    } else {
      // follow system
      const prefersDark =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
      root.style.colorScheme = prefersDark ? "dark" : "light";
    }
  } catch {
    // noop
  }
}

export default function ThemeToggleIcon() {
  const [mode, setMode] = React.useState<"system" | "dark" | "light">(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      return v === "dark" || v === "light" || v === "system" ? (v as any) : "system";
    } catch {
      return "system";
    }
  });

  React.useEffect(() => {
    applyTheme(mode);

    let mq: MediaQueryList | null = null;
    const handleChange = () => {
      if (mode === "system") applyTheme("system");
    };

    try {
      mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", handleChange);
      else if (mq && (mq as any).addListener) (mq as any).addListener(handleChange);
    } catch {
      /* ignore */
    }

    return () => {
      try {
        if (mq && mq.removeEventListener) mq.removeEventListener("change", handleChange);
        else if (mq && (mq as any).removeListener) (mq as any).removeListener(handleChange);
      } catch {
        /* ignore */
      }
    };
  }, [mode]);

  const onSelect = (m: "system" | "dark" | "light") => {
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      /* ignore */
    }
    setMode(m);
    applyTheme(m);
  };

  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8" aria-label={`Theme: ${mode}`}>
          <Icon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" forceMount>
        <DropdownMenuItem onClick={() => onSelect("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSelect("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
