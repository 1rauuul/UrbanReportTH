interface Props {
  icon: string;
  className?: string;
}

export default function IncidenciaIcon({ icon, className = "h-8 w-8" }: Props) {
  switch (icon) {
    case "road":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h18M9 17l1.5-9h3L15 17M3 12h18" />
          <circle cx="8" cy="17" r="1" fill="currentColor" stroke="none" />
          <circle cx="16" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "trash":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          <path strokeLinecap="round" d="M10 11v6M14 11v6" />
        </svg>
      );
    case "droplet":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path strokeLinecap="round" d="M9 14s.5 3 3 3 3-3 3-3" />
        </svg>
      );
    case "zap":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 8v4M12 16h.01" />
        </svg>
      );
  }
}
