import Link from "next/link";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-primary-dark/40 bg-header-bar shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 text-white sm:px-8">
          <h1 className="text-xs font-semibold uppercase tracking-widest sm:text-sm">
            Reporte ciudadano
          </h1>
          <img src="/favicon.png" alt="Logo" className="h-11 w-11 shrink-0 rounded sm:h-12 sm:w-12" />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
          <Card variant="panel" padding="lg">
            <h2 className="text-xl font-bold text-primary sm:text-2xl">
              SIMAC Tehuacan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
              Canal oficial para reportar incidencias en vía pública y dar seguimiento a su atención.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Link href="/login">
                <Button variant="primary" fullWidth>
                  Acceso ciudadano
                </Button>
              </Link>
              <Link href="/staff/login">
                <Button variant="secondary" fullWidth>
                  Acceso institucional (gobierno / dependencia)
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border bg-surface px-4 py-5 text-center sm:px-8">
        <p className="text-[11px] text-muted sm:text-xs">
          Gobierno del Estado de Puebla — H. Ayuntamiento de Tehuacán · Uso demostración
        </p>
      </footer>
    </div>
  );
}
