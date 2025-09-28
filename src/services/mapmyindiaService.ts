// src/services/mapboxService.ts
// Service to fetch cities and areas from Mapbox Places API
// You must set your Mapbox API key in the .env file as REACT_APP_MAPBOX_TOKEN

const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export async function fetchCitiesAndAreas(query: string, token: string, types: string = 'place,locality,neighborhood'): Promise<any[]> {
  if (!query) return [];
  const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&types=${types}&country=IN&limit=10`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch from Mapbox API');
  }
  const data = await response.json();
  // The API returns an array of features
  return data.features || [];
}
