import { Link } from "react-router-dom";

export default function VerifyEmailSent() {
  return (
    <div className="min-h-screen bg-background text-foreground grid place-items-center p-6">
      <div className="w-full max-w-md space-y-3 p-6 rounded-lg border border-border bg-card text-card-foreground">
        <h1 className="text-xl font-bold">Verifica email inviata</h1>
        <p className="text-sm text-muted-foreground">
          Ti abbiamo inviato una email con il link di verifica. Aprila per attivare l’account.
        </p>
        <p className="text-sm text-muted-foreground">
          Non la trovi? Controlla nello spam o riprova più tardi.
        </p>
        <div className="text-sm">
          Torna al <Link to="/login" className="underline">Login</Link>
        </div>
      </div>
    </div>
  );
}
