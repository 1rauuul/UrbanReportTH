import { type EstatusReporte, ESTATUS_LABELS } from "@/lib/mock-data";

const estatusStyles: Record<EstatusReporte, string> = {
  creado: "bg-primary/12 text-primary-dark border border-primary/25",
  asignado_a_dependencia: "bg-primary/8 text-primary border border-primary/20",
  asignado_a_jefe_cuadrilla: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  en_proceso: "bg-warning/12 text-[#7a5610] border border-warning/25",
  solucionado_por_cuadrilla: "bg-success/10 text-success border border-success/20",
  pendiente_revision_ciudadana: "bg-orange-50 text-orange-700 border border-orange-200",
  reabierto_por_ciudadano: "bg-red-50 text-red-700 border border-red-200",
  cerrado: "bg-success/15 text-success border border-success/25",
  cerrado_administrativamente: "bg-[#e8ebe8] text-muted border border-border",
};

interface BadgeProps {
  estatus: EstatusReporte;
  className?: string;
}

export default function Badge({ estatus, className = "" }: BadgeProps) {
  const style = estatusStyles[estatus] ?? "bg-gray-100 text-gray-600 border border-gray-200";
  const label = ESTATUS_LABELS[estatus] ?? estatus;

  return (
    <span
      className={[
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        style,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </span>
  );
}
