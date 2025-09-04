import React from "react";
import { api } from "../lib/api";

export default function ProtectedPing() {
  const [out, setOut] = React.useState("Premi per chiamare /v1/profile/ (protetto)");

  async function callProfile() {
    setOut("Chiamo /v1/profile/ ...");
  const res = await api.get("/v1/profile/");
  if (res.ok) setOut(`✅ ${res.status} /v1/profile/ → ${JSON.stringify(res.data)}`);
  else if (res.status === 401) setOut("🔒 401: non autenticato (rifai login?)");
  else setOut(`⚠️ ${res.status} /v1/profile/ → ${JSON.stringify(res.error ?? res.data)}`);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={callProfile}
        className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border
                   bg-secondary text-secondary-foreground hover:opacity-90 text-sm font-medium"
      >
        Call /v1/profile/
      </button>
      <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">{out}</pre>
    </div>
  );
}
