"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GovShield from "@/components/branding/GovShield";
import { DEPENDENCIAS } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

export default function DependenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const dependenciaActiva = useAppStore((s) => s.dependenciaActiva);
  const setDependenciaActiva = useAppStore((s) => s.setDependenciaActiva);
  const reportes = useAppStore((s) => s.reportes);

  const asignadosAqui = reportes.filter((r) => r.dependencia === dependenciaActiva).length;

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-black/10 bg-header-bar text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <h1 className="text-[10px] font-semibold uppercase tracking-widest sm:text-xs">
            Dependencia · UrbaReport
          </h1>
          <GovShield variant="onDark" className="h-9 w-9 shrink-0" />
        </div>
      </header>
      <div className="border-b border-border bg-white px-4 py-4 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">Dependencia municipal</p>
            <select
              value={dependenciaActiva}
              onChange={(e) => setDependenciaActiva(e.target.value)}
              className="mt-1 w-full max-w-md appearance-none rounded border border-input-border bg-input-soft bg-[length:1rem] bg-[right_0.5rem_center] bg-no-repeat py-2 pl-3 pr-8 text-sm font-semibold text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 sm:text-base"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23691c32'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
              }}
              aria-label="Seleccionar dependencia"
            >
              {DEPENDENCIAS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted">{asignadosAqui} reportes asignados</p>
          </div>
          <nav className="flex gap-2">
            <Link
              href="/dependencia/dashboard"
              className={[
                "rounded-sm border px-3 py-2 text-xs font-semibold sm:text-sm",
                pathname.includes("/dashboard")
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted hover:bg-input-soft",
              ].join(" ")}
            >
              Bandeja
            </Link>
            <Link
              href="/dependencia/metricas"
              className={[
                "rounded-sm border px-3 py-2 text-xs font-semibold sm:text-sm",
                pathname.includes("/metricas")
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-transparent text-muted hover:bg-input-soft",
              ].join(" ")}
            >
              Métricas
            </Link>
          </nav>
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-4 py-4 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
