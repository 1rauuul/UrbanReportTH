import Link from "next/link";
import GovShield from "@/components/branding/GovShield";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="border-b border-black/10 bg-header-bar shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 text-white sm:px-8">
          <h1 className="text-xs font-semibold uppercase tracking-widest sm:text-sm">
            Reporte ciudadano
          </h1>
          <GovShield variant="onDark" className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <Card variant="panel" padding="lg">
            <h2 className="text-lg font-semibold text-primary sm:text-xl">
              UrbaReport Tehuacán — Incidencias urbanas
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Canal oficial para registrar hallazgos en vía pública y dar seguimiento al estatus de su
              atención por las dependencias municipales competentes.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/login" className="sm:min-w-[200px]">
                <Button variant="primary" fullWidth className="text-sm sm:text-base">
                  Acceso ciudadanos
                </Button>
              </Link>
              <Link href="/gobierno/dashboard" className="sm:min-w-[200px]">
                <Button variant="secondary" fullWidth className="text-sm sm:text-base">
                  Mesa de control (gobierno)
                </Button>
              </Link>
            </div>
          </Card>

          <Card variant="default" padding="lg" className="max-w-4xl">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
              Trámites y enlaces
            </h3>
            <p className="mt-2 text-sm text-muted">
              Personal de dependencias municipales puede consultar la bandeja de reportes asignados.
            </p>
            <p className="mt-4 text-sm text-muted">
              ¿Dependencia operativa?{" "}
              <Link
                href="/dependencia/dashboard"
                className="font-semibold text-primary underline decoration-1 underline-offset-2 hover:text-primary-dark"
              >
                Acceso dependencias
              </Link>
            </p>
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
