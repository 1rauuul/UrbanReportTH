/** Escudo simplificado estilo gubernamental (referencia Ventanilla / pagos en línea Puebla). */
export default function GovShield({
  className = "h-10 w-10 shrink-0",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "onDark";
}) {
  const fill = variant === "onDark" ? "#ffffff" : "#691C32";
  const stroke = variant === "onDark" ? "rgba(255,255,255,0.4)" : "#4A1424";
  const cross = variant === "onDark" ? "#f5e6b8" : "#C89520";

  return (
    <svg
      className={className}
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M24 2L4 10v16c0 14.5 8.5 26 20 30 11.5-4 20-15.5 20-30V10L24 2z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
      <path
        d="M24 16v14M17 23h14"
        stroke={cross}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
