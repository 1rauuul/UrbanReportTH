"use client";

import { useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapLocation {
  lat: number;
  lng: number;
}

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickHandler({ onChange }: { onChange: (loc: MapLocation) => void }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  const lastRef = useRef<string | null>(null);
  if (target) {
    const key = target.join(",");
    if (key !== lastRef.current) {
      lastRef.current = key;
      map.flyTo(target, 17, { animate: true, duration: 1 });
    }
  }
  return null;
}

interface Props {
  center: [number, number];
  position: MapLocation | null;
  flyTarget: [number, number] | null;
  onChange: (loc: MapLocation) => void;
}

export default function LocationMapInner({ center, position, flyTarget, onChange }: Props) {
  return (
    <div className="overflow-hidden rounded border border-input-border">
      <MapContainer
        center={center}
        zoom={15}
        className="h-56 w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={onChange} />
        <FlyTo target={flyTarget} />
        {position && <Marker position={[position.lat, position.lng]} icon={icon} />}
      </MapContainer>
      <div className="border-t border-input-border bg-input-soft/50 px-3 py-2">
        <button
          type="button"
          className="text-xs font-semibold text-primary underline"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition((pos) => {
              onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
          }}
        >
          Usar mi ubicación
        </button>
        {position && (
          <p className="mt-1 text-[10px] text-muted">
            {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
