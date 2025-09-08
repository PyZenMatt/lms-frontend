import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getRoleFromToken } from "@/lib/auth";
import { getDashboardHome } from "@/lib/dashboard";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  Label,
  Input,
  Button,
  Checkbox,
  Alert,
} from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation() as ReturnType<() => { state?: { from?: { pathname?: string } } }>;
  const from: string | undefined = location?.state?.from?.pathname;

  const [ident, setIdent] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("" as string);
  const [errorId] = React.useState(() => `login-err-${Math.random().toString(36).slice(2,8)}`);
  const identRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    // Autofocus the first field for keyboard users on mount
    identRef.current?.focus();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Signing in...");
    const ok = await login(ident, password);
    if (!ok) { setMsg("Credenziali non valide"); return; }
    setMsg("OK");

    if (from && from !== "/login") {
      nav(from, { replace: true });
      return;
    }

  // Decide la home in base al ruolo
  const role = getRoleFromToken();
    nav(getDashboardHome(role), { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Optional hero/split - hidden on small */}
          <div className="hidden md:block">
            {/* Placeholder hero area; visual should come from Figma assets */}
            <div className="h-96 bg-gradient-to-br from-accent/10 to-muted/10 rounded-lg" aria-hidden />
          </div>
          <Card className="mx-auto w-full max-w-[440px] login-card">
            <CardHeader className="px-8 pt-8">
              <div>
                <h1 className="text-2xl font-semibold">Accedi</h1>
                <p className="text-sm text-muted-foreground mt-1">Usa le tue credenziali per proseguire</p>
              </div>
            </CardHeader>
            <CardContent className="px-8 [&:last-child]:pb-8">
              <form onSubmit={onSubmit} className="mt-4 grid gap-4" noValidate>
                <div className="grid gap-2">
                  <Label htmlFor="ident">Email o Username</Label>
                  <Input
                    ref={identRef}
                    id="ident"
                    type="text"
                    autoComplete="username"
                    value={ident}
                    onChange={(e) => setIdent(e.target.value)}
                    aria-invalid={!!msg}
                    aria-describedby={msg ? errorId : undefined}
                    required
                    autoFocus
                    className="h-11"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={!!msg}
                    aria-describedby={msg ? errorId : undefined}
                    required
                    className="h-11"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="inline-block">Ricordami</Label>
                  </div>
                  <Link to="/forgot" className="text-sm underline">
                    Password dimenticata?
                  </Link>
                </div>

                {msg ? (
                  <div id={errorId}>
                    <Alert variant="error">{msg}</Alert>
                  </div>
                ) : null}

                <div>
                  <Button type="submit" className="w-full h-11">
                    Entra
                  </Button>
                </div>

                <div className="text-sm text-center">
                  Non hai un account? <Link to="/register" className="underline">Registrati</Link>
                </div>
              </form>
            </CardContent>
            <CardFooter className="px-8 pb-8">
              <div className="w-full text-center text-xs text-muted-foreground">Accedendo accetti i termini del servizio.</div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
