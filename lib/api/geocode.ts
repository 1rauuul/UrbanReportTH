export interface GeocodeResult {
  calle: string;
  colonia: string;
  codigoPostal: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
  try {
    const res = await fetch(url, {
      headers: { "Accept-Language": "es" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};

    const road = addr.road ?? addr.street ?? addr.path ?? "";
    const suburb = addr.suburb ?? addr.neighbourhood ?? addr.district ?? "";
    const postcode = addr.postcode ?? "";

    return {
      calle: road,
      colonia: suburb,
      codigoPostal: postcode,
    };
  } catch {
    return null;
  }
}