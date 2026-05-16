import Link from "next/link";
import GovShield from "@/components/branding/GovShield";

interface TopBarProps {
  title: string;
  backHref?: string;
}

export default function TopBar({ title, backHref }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-black/10 bg-header-bar shadow-sm">
      <div className="flex min-h-14 items-center gap-3 px-3 py-3 text-white sm:px-4">
        {backHref ? (
          <Link
            href={backHref}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-xl font-semibold hover:bg-white/10"
            aria-label="Volver"
          >
            ←
          </Link>
        ) : (
          <span className="w-9 shrink-0" aria-hidden="true" />
        )}
        <h1 className="min-w-0 flex-1 text-center text-xs font-semibold uppercase leading-tight tracking-wide sm:text-left sm:text-sm">
          {title}
        </h1>
        <GovShield variant="onDark" className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
      </div>
    </header>
  );
}
