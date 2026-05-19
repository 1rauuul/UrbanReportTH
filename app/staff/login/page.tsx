"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GovShield from "@/components/branding/GovShield";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const ROLE_LABELS: Record<string, string> = {
  gobierno: "Mesa de Control",
  dependencia: "Dependencia",
  cuadrilla: "Jefe de Cuadrilla",
};

function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Credenciales inválidas.");
        return;
      }

      const rol: string = data.usuario.rol;
      if (rol === "MESA_CONTROL") {
        router.push("/gobierno/dashboard");
      } else if (rol === "DEPENDENCIA") {
        router.push("/dependencia/dashboard");
      } else if (rol === "JEFE_CUADRILLA") {
        router.push("/cuadrilla/dashboard");
      } else {
        setError("Rol no reconocido.");
      }
    } catch {
      setError("Error de conexión. Verifica tu red.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-black/10 bg-header-bar shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-4 py-4 text-white sm:px-8">
          <h1 className="text-xs font-semibold uppercase tracking-widest sm:text-sm">
            Acceso institucional
          </h1>
          <GovShield variant="onDark" className="h-11 w-11 shrink-0" />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">
          <Card variant="panel" padding="lg">
            <h2 className="mb-1 text-lg font-bold text-primary">
              {from ? ROLE_LABELS[from] ?? "Portal institucional" : "Portal institucional"}
            </h2>
            <p className="mb-5 text-sm text-muted">
              H. Ayuntamiento de Tehuacán · Acceso con credenciales institucionales.
            </p>

            <div className="flex flex-col gap-4">
              <Input
                label="Correo institucional"
                fieldVariant="soft"
                type="email"
                placeholder="correo@tehuacan.gob.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              <Input
                label="Contraseña"
                fieldVariant="soft"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              {error && (
                <p className="text-sm font-medium text-danger">{error}</p>
              )}
              <Button
                fullWidth
                onClick={handleLogin}
                disabled={cargando}
              >
                {cargando ? "Verificando…" : "Ingresar"}
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted">
                ¿Ciudadano?{" "}
                <a href="/login" className="font-semibold text-primary underline underline-offset-2">
                  Acceso ciudadano por OTP
                </a>
              </p>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-4 text-center">
        <p className="text-[11px] text-muted">
          Gobierno del Estado de Puebla — H. Ayuntamiento de Tehuacán
        </p>
      </footer>
    </div>
  );
}

export default function StaffLoginPage() {
  return (
    <Suspense>
      <StaffLoginForm />
    </Suspense>
  );
}
