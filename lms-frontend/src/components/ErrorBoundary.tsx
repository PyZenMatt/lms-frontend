// src/components/ErrorBoundary.tsx
import React from "react";

type Props = { fallback?: React.ReactNode; children: React.ReactNode };
type State = { hasError: boolean; error?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, info: any) {
    console.error("UI ErrorBoundary:", error, info);
    window.dispatchEvent(
      new CustomEvent("toast:show", {
        detail: { type: "error", message: "Si è verificato un errore imprevisto." },
      })
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="m-6 rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Qualcosa è andato storto</h2>
            <p className="text-sm text-muted-foreground">
              Riprova più tardi o torna alla dashboard.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
