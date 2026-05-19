"use client";

import dynamic from "next/dynamic";
import type { MapLocation } from "./LocationMapInner";

export type { MapLocation };

const TEHUACAN: [number, number] = [18.4615, -97.3928];

interface Props {
  value: MapLocation | null;
  onChange: (loc: MapLocation) => void;
}

const MapInner = dynamic(() => import("./LocationMapInner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded border border-dashed border-input-border bg-input-soft/60 text-sm text-muted">
      Cargando mapa...
    </div>
  ),
});

export default function LocationMap({ value, onChange }: Props) {
  return (
    <MapInner
      center={value ? [value.lat, value.lng] : TEHUACAN}
      position={value}
      flyTarget={value ? [value.lat, value.lng] : null}
      onChange={onChange}
    />
  );
}
