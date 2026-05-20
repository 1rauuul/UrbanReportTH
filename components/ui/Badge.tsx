import { type EstatusReporte, ESTATUS_LABELS } from "@/lib/mock-data";

const estatusStyles: Record<EstatusReporte, string> = {
  creado: "bg-primary/12 text-primary border border-primary/25",
  asignado_a_dependencia: "bg-primary/8 text-primary border border-primary/20",
  asignado_a_jefe_cuadrilla: "bg-primary/8 text-primary border border-primary/20",
  en_proceso: "bg-warning/12 text-warning border border-warning/25",
  solucionado_por_cuadrilla: "bg-success/12 text-success border border-success/25",
  pendiente_revision_ciudadana: "bg-warning/10 text-warning border border-warning/20",
  reabierto_por_ciudadano: "bg-primary/10 text-primary border border-primary/20",
  cerrado: "bg-success/15 text-success border border-success/25",
  cerrado_administrativamente: "bg-muted/15 text-muted border border-muted/25",
};

interface BadgeProps {
  estatus: EstatusReporte;
  className?: string;
}

export default function Badge({ estatus, className = "" }: BadgeProps) {
  const style = estatusStyles[estatus] ?? "bg-muted/15 text-muted border border-muted/25";
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
