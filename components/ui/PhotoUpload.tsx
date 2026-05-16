"use client";

import { useRef, useState } from "react";
import { MAX_PHOTO_BYTES } from "@/lib/offline/db";

interface Props {
  value: Blob | null;
  previewUrl?: string | null;
  onChange: (blob: Blob | null, preview: string | null) => void;
}

export default function PhotoUpload({ value, previewUrl, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function handleFile(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > MAX_PHOTO_BYTES) {
      setError("La imagen supera 5 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    onChange(file, url);
  }

  const preview = previewUrl ?? (value ? URL.createObjectURL(value) : null);

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {preview ? (
        <div className="relative overflow-hidden rounded border border-input-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Evidencia" className="h-48 w-full object-cover" />
          <button
            type="button"
            className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-xs font-semibold text-danger"
            onClick={() => onChange(null, null)}
          >
            Quitar
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          className="flex h-48 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded border border-dashed border-input-border bg-input-soft/80 px-4"
        >
          <svg
            className="h-12 w-12 text-primary"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-center text-sm font-semibold text-primary">
            Tomar foto o elegir de galería
          </p>
          <p className="text-center text-xs text-muted">JPG o PNG, máximo 5 MB</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          className="flex-1 rounded border border-input-border bg-white py-2.5 text-sm font-semibold text-text hover:bg-input-soft/40"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.capture = "environment";
              inputRef.current.click();
            }
          }}
        >
          Cámara
        </button>
        <button
          type="button"
          className="flex-1 rounded border border-input-border bg-white py-2.5 text-sm font-semibold text-text hover:bg-input-soft/40"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.removeAttribute("capture");
              inputRef.current.click();
            }
          }}
        >
          Galería
        </button>
      </div>
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
