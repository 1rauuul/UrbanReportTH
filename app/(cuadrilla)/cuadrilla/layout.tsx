"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import GovShield from "@/components/branding/GovShield";

export default function CuadrillaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-black/10 bg-header-bar text-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <h1 className="text-[10px] font-semibold uppercase tracking-widest sm:text-xs">
            Cuadrilla · UrbaReport
          </h1>
          <GovShield variant="onDark" className="h-9 w-9 shrink-0" />
        </div>
      </header>
      <div className="border-b border-border bg-white px-4 py-2 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Link
            href="/cuadrilla/dashboard"
            className={[
              "rounded-sm border px-3 py-2 text-xs font-semibold sm:text-sm",
              pathname.includes("/dashboard")
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-transparent text-muted hover:bg-input-soft",
            ].join(" ")}
          >
            Mis reportes
          </Link>
        </div>
      </div>
      <main className="mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-6">{children}</main>
    </div>
  );
}
