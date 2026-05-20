"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";


function IconBandeja(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconMapa(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  );
}

const links = [
  { href: "/gobierno/dashboard", label: "Bandeja", Icon: IconBandeja },
  { href: "/gobierno/dashboard?tab=mapa", label: "Mapa de calor", Icon: IconMapa },
] as const;

export default function SidebarGobierno() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-header-bar px-3 py-3 text-white">
        <span className="text-[10px] font-semibold uppercase leading-tight tracking-wide">
          UrbaReport
        </span>
        <img src="/favicon.png" alt="Logo" className="h-8 w-8 shrink-0 rounded" />
      </div>
      <div className="border-b border-border px-3 py-3">
        <p className="text-xs font-semibold text-primary">Mesa de control</p>
        <p className="text-[11px] text-muted">Tehuacán, Puebla</p>
      </div>
      <nav className="flex flex-col gap-0.5 p-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href.split("?")[0]);
          const { Icon } = link;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "flex items-center gap-3 rounded-sm border border-transparent px-3 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "border-primary/20 bg-primary/10 text-primary"
                  : "text-text hover:bg-input-soft/80",
              ].join(" ")}
            >
              <Icon className="h-5 w-5 shrink-0 text-current opacity-80" aria-hidden="true" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
