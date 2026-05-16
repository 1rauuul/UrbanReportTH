"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement, SVGProps } from "react";

function IconReportar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconLista(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6" />
    </svg>
  );
}

function IconPerfil(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const tabs: {
  href: string;
  label: string;
  Icon: (p: SVGProps<SVGSVGElement>) => ReactElement;
}[] = [
  { href: "/nuevo-reporte", label: "Reportar", Icon: IconReportar },
  { href: "/mis-reportes", label: "Mis reportes", Icon: IconLista },
  { href: "/perfil", label: "Perfil", Icon: IconPerfil },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t-2 border-primary/20 bg-white shadow-[0_-2px_8px_rgba(105,28,50,0.08)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const { Icon } = tab;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors",
                active ? "text-primary" : "text-muted",
              ].join(" ")}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
