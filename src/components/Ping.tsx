import React from "react";
import { api } from "@/lib/api";
import { API_PING_PATH } from "@/lib/config";

export default function Ping() {
  const [out, setOut] = React.useState<string>("");

  async function handlePing() {
    setOut("Pinging...");
    const res = await api.get(API_PING_PATH);
    if (res.ok) {
      setOut(`✅ ${res.status} ${API_PING_PATH} → ${JSON.stringify(res.data)}`);
    } else if (res.status === 0) {
      setOut("❌ Network error (server spento? URL errato? CORS bloccato?)");
    } else {
      setOut(`⚠️ ${res.status} ${API_PING_PATH} → ${JSON.stringify(res.error ?? res.data)}`);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handlePing}
        className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-border
                   bg-secondary text-secondary-foreground hover:opacity-90 text-sm font-medium"
      >
        Ping API
      </button>
      <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">{out}</pre>
    </div>
  );
}
