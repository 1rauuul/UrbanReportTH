import { Fragment } from "react";

export default function FormStepper({
  steps,
  activeIndex,
}: {
  steps: string[];
  activeIndex: number;
}) {
  return (
    <nav
      className="border-b border-border bg-white px-4 py-3 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]"
      aria-label="Pasos del trámite"
    >
      <ol className="flex list-none flex-wrap items-center gap-x-0 gap-y-2 p-0 m-0 text-sm">
        {steps.map((label, i) => (
          <Fragment key={label}>
            <li
              className={[
                "whitespace-nowrap",
                i === activeIndex ? "font-semibold text-primary" : "font-normal text-muted",
              ].join(" ")}
              aria-current={i === activeIndex ? "step" : undefined}
            >
              <span className="tabular-nums">{i + 1}</span> {label}
            </li>
            {i < steps.length - 1 && (
              <li className="px-2 text-muted select-none" aria-hidden="true">
                &gt;
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
