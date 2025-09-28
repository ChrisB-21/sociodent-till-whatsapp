// src/services/mapboxGeocode.ts
// Geocoding utility using Mapbox API for address to coordinates

const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.REACT_APP_MAPBOX_TOKEN || "";

export async function getCoordinatesFromMapbox(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address || !MAPBOX_TOKEN) return null;
  const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=IN&limit=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (e) {
    return null;
  }
}
