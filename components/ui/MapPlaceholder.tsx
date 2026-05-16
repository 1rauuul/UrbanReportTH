export default function MapPlaceholder() {
  return (
    <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded border border-dashed border-input-border bg-input-soft/60 px-4">
      <svg
        className="h-10 w-10 text-primary"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
      <p className="text-center text-sm font-semibold text-text">Mapa interactivo</p>
      <p className="text-center text-xs text-muted">Arrastra el pin para ajustar la ubicación</p>
      <button
        type="button"
        className="mt-1 rounded border border-primary bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
      >
        Usar mi ubicación
      </button>
    </div>
  );
}
