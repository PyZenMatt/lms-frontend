import React from "react";
import { api } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";

const ROLES = [
  { value: "student", label: "Studente" },
  { value: "teacher", label: "Docente" },
  // "admin" esiste ma non lo esponiamo nel form pubblico
];

export default function Register() {
  const nav = useNavigate();
  const [username, setU] = React.useState("");
  const [email, setE] = React.useState("");
  const [password, setP] = React.useState("");
  const [role, setR] = React.useState("student");
  const [msg, setMsg] = React.useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Invio registrazione...");
    if (!email.includes("@") || password.length < 6 || username.trim().length < 3) {
      setMsg("Controlla i campi: email valida, password ≥ 6 caratteri, username ≥ 3.");
      return;
    }
  // Public endpoint - avoid attaching Authorization header (noAuth:true)
  const res = await api.post("/v1/register/", { username, email, password, role }, { noAuth: true });
    if (!res.ok) {
      const detail = (res.data as any)?.detail || JSON.stringify(res.data);
      setMsg(`Errore: ${detail || res.status}`);
      return;
    }
    nav("/verify-email-sent", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 p-6 rounded-lg border border-border bg-card text-card-foreground">
        <h1 className="text-xl font-bold">Crea un account</h1>

        <div>
          <label className="text-sm">Username</label>
          <input className="w-full px-3 py-2 rounded-md border border-border bg-background"
                 value={username} onChange={e=>setU(e.target.value)} placeholder="es. teo93"
          />
        </div>

        <div>
          <label className="text-sm">Email</label>
          <input className="w-full px-3 py-2 rounded-md border border-border bg-background"
                 type="email" value={email} onChange={e=>setE(e.target.value)} placeholder="tuo@email.com"
          />
        </div>

        <div>
          <label className="text-sm">Password</label>
          <input className="w-full px-3 py-2 rounded-md border border-border bg-background"
                 type="password" value={password} onChange={e=>setP(e.target.value)} placeholder="min 6 caratteri"
          />
        </div>

        <div>
          <label className="text-sm">Ruolo</label>
          <select className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  value={role} onChange={e=>setR(e.target.value)}>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        <button type="submit" className="w-full px-3 py-2 rounded-md bg-primary text-primary-foreground">
          Registrati
        </button>

        <div className="text-sm text-muted-foreground">{msg}</div>

        <div className="text-sm">
          Hai già un account? <Link to="/login" className="underline">Accedi</Link>
        </div>
      </form>
    </div>
  );
}
