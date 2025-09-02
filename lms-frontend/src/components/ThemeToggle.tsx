import React from "react";

const THEME_KEY = "theme" as const; // 'dark' | 'light' | 'system'

function applyTheme(mode: string) {
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
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) root.classList.add("dark");
      else root.classList.remove("dark");
      root.style.colorScheme = prefersDark ? "dark" : "light";
    }
  } catch {
    // noop
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = React.useState<string>(() => {
    try {
      return localStorage.getItem(THEME_KEY) ?? "system";
    } catch {
      return "system";
    }
  });

  React.useEffect(() => {
    applyTheme(mode);

    // if system mode, listen to OS changes
    let mq: MediaQueryList | null = null;
    const handleChange = () => {
      if (mode === "system") applyTheme("system");
    };
    try {
      mq = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
      if (mq && mq.addEventListener) mq.addEventListener("change", handleChange);
      else if (mq && (mq as any).addListener) (mq as any).addListener(handleChange);
  } catch { /* ignore */ }

    return () => {
      try {
        if (mq && mq.removeEventListener) mq.removeEventListener("change", handleChange);
        else if (mq && (mq as any).removeListener) (mq as any).removeListener(handleChange);
  } catch { /* ignore */ }
    };
  }, [mode]);

  const onChange = (v: string) => {
    try { localStorage.setItem(THEME_KEY, v); } catch {}
    setMode(v);
    applyTheme(v);
  };

  return (
    <div className="px-3 py-2">
      <label className="text-xs text-muted-foreground block mb-1">Theme</label>
      <div className="flex items-center gap-2">
        <select
          value={mode}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-md border px-2 py-1 text-sm bg-background text-foreground"
          aria-label="Theme"
        >
          <option value="system">System</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
        <button
          type="button"
          onClick={() => { try { localStorage.removeItem(THEME_KEY); } catch {} ; setMode('system'); applyTheme('system'); }}
          className="text-xs text-muted-foreground underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

