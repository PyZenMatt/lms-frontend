import { useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "theme";

// useTheme hook disabled - single OpenPython theme enforced
function getInitialTheme(): Theme {
  // Always return light since we only use OpenPython theme
  return "light";
}

export default function useTheme() {
  // Fixed to light theme - no switching allowed
  const [theme] = useState<Theme>("light");
  const isDark = false; // Always false since we don't use dark mode

  useEffect(() => {
    // Prevent any theme switching - ensure no dark class
    const root = document.documentElement;
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    
    // Clear any theme storage since we only use one theme
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }, []);

  // All these functions are no-ops since we don't allow theme switching
  const setLight = useCallback(() => {
    console.debug('[useTheme] Theme switching disabled - using single OpenPython theme');
  }, []);
  const setDark = useCallback(() => {
    console.debug('[useTheme] Theme switching disabled - using single OpenPython theme');
  }, []);
  const toggle = useCallback(() => {
    console.debug('[useTheme] Theme switching disabled - using single OpenPython theme');
  }, []);
  const setTheme = useCallback(() => {
    console.debug('[useTheme] Theme switching disabled - using single OpenPython theme');
  }, []);

  return { theme, isDark, setLight, setDark, toggle, setTheme };
}
