import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "accent" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark active:bg-primary-dark",
  secondary:
    "bg-white text-primary border-2 border-primary hover:bg-primary/5",
  accent:
    "bg-accent text-white hover:bg-accent-dark active:bg-accent-dark",
  danger:
    "bg-danger text-white hover:bg-[#a32224]",
  ghost:
    "bg-transparent text-primary hover:bg-primary/10",
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
        "inline-flex min-h-11 items-center justify-center rounded px-5 text-base font-semibold transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
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
