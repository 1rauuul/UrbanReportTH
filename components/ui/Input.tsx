import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Fondo azul muy claro como en formularios de referencia. */
  fieldVariant?: "default" | "soft";
}

export function Input({
  label,
  error,
  hint,
  fieldVariant = "default",
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const bgSoft = fieldVariant === "soft" ? "bg-input-soft" : "bg-surface";

  return (
    <div className="flex flex-col gap-1">
      <div className="relative mt-1">
        {label && (
          <label
            htmlFor={inputId}
            className={[
              "pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 px-1 text-xs font-medium",
              error ? "text-danger" : "text-muted",
              bgSoft,
            ].join(" ")}
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={[
            "min-h-11 w-full rounded border border-input-border px-3 pb-2.5 pt-4 text-base text-text",
            "placeholder:text-muted/80",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
            bgSoft,
            error ? "border-danger" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fieldVariant?: "default" | "soft";
}

export function Textarea({
  label,
  error,
  fieldVariant = "soft",
  className = "",
  id,
  ...props
}: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const bgSoft = fieldVariant === "soft" ? "bg-input-soft" : "bg-surface";

  return (
    <div className="flex flex-col gap-1">
      <div className="relative mt-1">
        {label && (
          <label
            htmlFor={inputId}
            className={[
              "pointer-events-none absolute left-3 top-0 z-[1] -translate-y-1/2 px-1 text-xs font-medium",
              error ? "text-danger" : "text-muted",
              bgSoft,
            ].join(" ")}
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={[
            "min-h-28 w-full resize-none rounded border border-input-border px-3 py-3 pt-5 text-base text-text",
            "placeholder:text-muted/80",
            "focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30",
            bgSoft,
            error ? "border-danger" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
