import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  /** Panel tipo trámite: borde izquierdo grueso en color institucional. */
  variant?: "default" | "panel";
}

const paddingMap = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

const variantMap = {
  default: [
    "rounded-md border border-border bg-surface",
    "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
  ].join(" "),
  panel: [
    "rounded-sm border border-border border-l-[6px] border-l-primary bg-surface",
    "shadow-[0_2px_10px_rgba(0,0,0,0.1)]",
  ].join(" "),
};

export default function Card({
  padding = "md",
  variant = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[variantMap[variant], paddingMap[padding], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
