import React from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, Button } from "@/components/ui";

export default function VerifyEmail() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const [status, setStatus] = React.useState<"loading" | "ok" | "error">("loading");
  const [detail, setDetail] = React.useState<string>("");

  React.useEffect(() => {
    (async () => {
      if (!uid || !token) { setStatus("error"); setDetail("Parametri mancanti"); return; }
  const res = await api.get(`/v1/verify-email/${uid}/${token}/`);
  if (res.ok) setStatus("ok");
  else {
    setStatus("error");
    const maybeDetail = (res.data as unknown) as { detail?: string };
    setDetail(maybeDetail?.detail || String(res.error) || `HTTP ${res.status}`);
  }
    })();
  }, [uid, token]);

  if (status === "loading") return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <div className="text-sm text-muted-foreground">Verifica in corso…</div>
    </div>
  );

  if (status === "ok") return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <Card className="w-full max-w-md space-y-3 p-6">
        <h1 className="text-xl font-bold">Email verificata ✅</h1>
        <p className="text-sm text-muted-foreground">Il tuo account è attivo. Ora puoi accedere.</p>
        <Link to="/login">
          <Button variant="default">Vai al Login</Button>
        </Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <Card className="w-full max-w-md space-y-3 p-6">
        <h1 className="text-xl font-bold">Verifica non riuscita</h1>
        <p id="verify-email-detail" className="text-sm text-destructive-foreground">Dettagli: {detail}</p>
        <div className="text-sm">
          Torna al <Link to="/login" className="underline">Login</Link>
        </div>
      </Card>
    </div>
  );
}

