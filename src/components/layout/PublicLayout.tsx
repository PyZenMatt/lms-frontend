import * as React from "react";
import ThemeToggleIcon from "@/components/ThemeToggleIcon";
import { useLanguage } from "@/context/LanguageContext";

/**
 * PublicLayout is a minimal layout wrapper for public pages (landing, etc.)
 * without authentication chrome (no sidebar, no protected elements).
 * Includes theme toggle and language selector in header and optional footer.
 */
export default function PublicLayout({
  children,
  footer,
}: {
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/60 backdrop-blur w-full">
        <div className="w-full flex h-14 items-center px-4 lg:px-6">
          <h1 className="text-lg font-semibold">SchoolPlatform</h1>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="flex gap-1 rounded border border-border bg-muted/30 p-1">
              <button
                onClick={() => setLanguage("it")}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  language === "it"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                IT
              </button>
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                  language === "en"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                EN
              </button>
            </div>
            <ThemeToggleIcon />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full">
        {children}
      </main>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-border bg-card/50 mt-auto py-6 px-4 lg:px-6">
          <div className="container mx-auto">{footer}</div>
        </footer>
      )}
    </div>
  );
}
