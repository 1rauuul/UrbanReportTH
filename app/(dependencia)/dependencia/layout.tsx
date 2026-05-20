"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


export default function DependenciaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-primary-dark/40 bg-header-bar text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <h1 className="text-[10px] font-semibold uppercase tracking-widest sm:text-xs">
            Dependencia · UrbaReport
          </h1>
          <img src="/favicon.png" alt="Logo" className="h-9 w-9 shrink-0 rounded" />
        </div>
      </header>
      <div className="border-b border-border bg-white px-4 py-3 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
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
