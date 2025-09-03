import React, { useEffect } from "react";
import useTxStatus from "../hooks/useTxStatus";

const explorerBase = import.meta.env.VITE_EXPLORER_TX ?? "https://amoy.polygonscan.com/tx";

export default function TxStatusPanel({ identifier }: { identifier: string }) {
  const { status, start } = useTxStatus();

  useEffect(() => {
    if (identifier) start(identifier);
  }, [identifier, start]);

  return (
    <div className="text-sm space-y-1">
      <div className="font-mono break-all">
        Tx: <a href={`${explorerBase}/${identifier}`} target="_blank" rel="noreferrer" className="underline">{identifier}</a>
      </div>
      <div>Status: {status ?? "pending"}</div>
    </div>
  );
}
