import indiaLocations from '../data/indiaLocations.json';

export interface Area {
  name: string;
  areas: string[];
}

export interface Locality {
  name: string;
  areas: string[];
}

export interface City {
  name: string;
  localities: Locality[];
}

export interface District {
  name: string;
  cities: City[];
}

export interface State {
  name: string;
  districts: District[];
}

export interface IndiaLocations {
  states: State[];
}

const locations: IndiaLocations = indiaLocations as IndiaLocations;

export function getStates() {
  return locations.states.map(s => s.name);
}

export function getDistricts(stateName: string) {
  const state = locations.states.find(s => s.name === stateName);
  return state ? state.districts.map(d => d.name) : [];
}

export function getCities(stateName: string, districtName: string) {
  const state = locations.states.find(s => s.name === stateName);
  const district = state?.districts.find(d => d.name === districtName);
  return district ? district.cities.map(c => c.name) : [];
}

export function getLocalities(stateName: string, districtName: string, cityName: string) {
  const state = locations.states.find(s => s.name === stateName);
  const district = state?.districts.find(d => d.name === districtName);
  const city = district?.cities.find(c => c.name === cityName);
  return city ? city.localities.map(l => l.name) : [];
}

export function getAreas(stateName: string, districtName: string, cityName: string, localityName: string) {
  const state = locations.states.find(s => s.name === stateName);
  const district = state?.districts.find(d => d.name === districtName);
  const city = district?.cities.find(c => c.name === cityName);
  const locality = city?.localities.find(l => l.name === localityName);
  return locality ? locality.areas : [];
}
