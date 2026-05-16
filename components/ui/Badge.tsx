import { Estatus, ESTATUS_LABELS } from "@/lib/mock-data";

const estatusStyles: Record<Estatus, string> = {
  recibido: "bg-primary/12 text-primary-dark border border-primary/25",
  en_revision: "bg-warning/15 text-[#8f6510] border border-warning/30",
  asignado: "bg-primary/8 text-primary border border-primary/20",
  en_proceso: "bg-warning/12 text-[#7a5610] border border-warning/25",
  resuelto: "bg-success/15 text-success border border-success/25",
  cerrado: "bg-[#e8ebe8] text-muted border border-border",
};

interface BadgeProps {
  estatus: Estatus;
  className?: string;
}

export default function Badge({ estatus, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold",
        estatusStyles[estatus],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {ESTATUS_LABELS[estatus]}
    </span>
  );
}
