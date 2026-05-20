import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
  secondary:
    "bg-white text-primary border-2 border-primary hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-primary/40",
  accent:
    "bg-warning text-white hover:bg-warning/80 active:bg-warning/80 focus-visible:ring-2 focus-visible:ring-warning/40 focus-visible:ring-offset-2",
  danger:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
  ghost:
    "bg-transparent text-primary hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/20",
};

export default function Button({
  variant = "primary",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-12 items-center justify-center rounded px-6 text-base font-bold transition-colors",
        "focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        fullWidth ? "w-full" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
