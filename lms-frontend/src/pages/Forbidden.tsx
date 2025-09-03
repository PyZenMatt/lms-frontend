import React from "react";
import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <div className="text-6xl mb-4">🚫</div>
      <h1 className="text-2xl font-semibold mb-2">Permesso negato</h1>
      <p className="text-muted-foreground mb-6">
        Non hai i permessi per accedere a questa pagina.
      </p>
      <div className="flex items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-md border px-4 hover:bg-accent"
        >
          Torna alla Home
        </Link>
        <Link
          to="/login"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-primary-foreground hover:opacity-90"
        >
          Vai al Login
        </Link>
      </div>
    </div>
  );
}
