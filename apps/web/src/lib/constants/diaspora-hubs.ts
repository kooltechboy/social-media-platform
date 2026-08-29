/**
 * Diaspora Hubs & Countries Constants
 *
 * TUKUBI platform — Caribbean Futurism design system
 * Global Caribbean diaspora population centers.
 */

export interface DiasporaCountry {
  iso: string; // ISO 3166-1 alpha-3
  name: string;
  flag: string;
  region: 'north_america' | 'europe' | 'south_america' | 'caribbean' | 'africa' | 'oceania' | 'asia';
}

export interface DiasporaCityHub {
  id: string;
  city: string;
  country: string;
  countryIso: string;
  flag: string;
  lat?: number;
  lng?: number;
}

export const DIASPORA_COUNTRIES: DiasporaCountry[] = [
  // North America
  { iso: 'USA', name: 'United States', flag: '🇺🇸', region: 'north_america' },
  { iso: 'CAN', name: 'Canada', flag: '🇨🇦', region: 'north_america' },
  { iso: 'MEX', name: 'Mexico', flag: '🇲🇽', region: 'north_america' },
  // Europe
  { iso: 'GBR', name: 'United Kingdom', flag: '🇬🇧', region: 'europe' },
  { iso: 'NLD', name: 'Netherlands', flag: '🇳🇱', region: 'europe' },
  { iso: 'FRA', name: 'France', flag: '🇫🇷', region: 'europe' },
  { iso: 'DEU', name: 'Germany', flag: '🇩🇪', region: 'europe' },
  { iso: 'ESP', name: 'Spain', flag: '🇪🇸', region: 'europe' },
  { iso: 'PRT', name: 'Portugal', flag: '🇵🇹', region: 'europe' },
  { iso: 'ITA', name: 'Italy', flag: '🇮🇹', region: 'europe' },
  { iso: 'BEL', name: 'Belgium', flag: '🇧🇪', region: 'europe' },
  { iso: 'SWE', name: 'Sweden', flag: '🇸🇪', region: 'europe' },
  { iso: 'NOR', name: 'Norway', flag: '🇳🇴', region: 'europe' },
  { iso: 'DNK', name: 'Denmark', flag: '🇩🇰', region: 'europe' },
  { iso: 'CHE', name: 'Switzerland', flag: '🇨🇭', region: 'europe' },
  // South America & Central America
  { iso: 'BRA', name: 'Brazil', flag: '🇧🇷', region: 'south_america' },
  { iso: 'VEN', name: 'Venezuela', flag: '🇻🇪', region: 'south_america' },
  { iso: 'COL', name: 'Colombia', flag: '🇨🇴', region: 'south_america' },
  { iso: 'PAN', name: 'Panama', flag: '🇵🇦', region: 'south_america' },
  { iso: 'ARG', name: 'Argentina', flag: '🇦🇷', region: 'south_america' },
  { iso: 'CRI', name: 'Costa Rica', flag: '🇨🇷', region: 'south_america' },
  // Africa
  { iso: 'NGA', name: 'Nigeria', flag: '🇳🇬', region: 'africa' },
  { iso: 'GHA', name: 'Ghana', flag: '🇬🇭', region: 'africa' },
  { iso: 'ZAF', name: 'South Africa', flag: '🇿🇦', region: 'africa' },
  // Oceania
  { iso: 'AUS', name: 'Australia', flag: '🇦🇺', region: 'oceania' },
  { iso: 'NZL', name: 'New Zealand', flag: '🇳🇿', region: 'oceania' },
  // Asia / Middle East
  { iso: 'ARE', name: 'United Arab Emirates', flag: '🇦🇪', region: 'asia' },
  { iso: 'JPN', name: 'Japan', flag: '🇯🇵', region: 'asia' },
  { iso: 'SGP', name: 'Singapore', flag: '🇸🇬', region: 'asia' },
];

export const DIASPORA_CITY_HUBS: DiasporaCityHub[] = [
  { id: 'hub-mia', city: 'Miami', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 25.7617, lng: -80.1918 },
  { id: 'hub-nyc', city: 'New York (Brooklyn / Queens / Bronx)', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 40.7128, lng: -74.0060 },
  { id: 'hub-tor', city: 'Toronto', country: 'Canada', countryIso: 'CAN', flag: '🇨🇦', lat: 43.6532, lng: -79.3832 },
  { id: 'hub-mtl', city: 'Montreal', country: 'Canada', countryIso: 'CAN', flag: '🇨🇦', lat: 45.5017, lng: -73.5673 },
  { id: 'hub-lon', city: 'London', country: 'United Kingdom', countryIso: 'GBR', flag: '🇬🇧', lat: 51.5074, lng: -0.1278 },
  { id: 'hub-bir', city: 'Birmingham', country: 'United Kingdom', countryIso: 'GBR', flag: '🇬🇧', lat: 52.4862, lng: -1.8904 },
  { id: 'hub-ams', city: 'Amsterdam', country: 'Netherlands', countryIso: 'NLD', flag: '🇳🇱', lat: 52.3676, lng: 4.9041 },
  { id: 'hub-rot', city: 'Rotterdam', country: 'Netherlands', countryIso: 'NLD', flag: '🇳🇱', lat: 51.9244, lng: 4.4777 },
  { id: 'hub-par', city: 'Paris', country: 'France', countryIso: 'FRA', flag: '🇫🇷', lat: 48.8566, lng: 2.3522 },
  { id: 'hub-mad', city: 'Madrid', country: 'Spain', countryIso: 'ESP', flag: '🇪🇸', lat: 40.4168, lng: -3.7038 },
  { id: 'hub-atl', city: 'Atlanta', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 33.7490, lng: -84.3880 },
  { id: 'hub-bos', city: 'Boston', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 42.3601, lng: -71.0589 },
  { id: 'hub-orl', city: 'Orlando', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 28.5383, lng: -81.3792 },
  { id: 'hub-hou', city: 'Houston', country: 'United States', countryIso: 'USA', flag: '🇺🇸', lat: 29.7604, lng: -95.3698 },
  { id: 'hub-pan', city: 'Panama City / Colón', country: 'Panama', countryIso: 'PAN', flag: '🇵🇦', lat: 8.9824, lng: -79.5199 },
];

export const DIASPORA_BY_REGION: Record<string, DiasporaCountry[]> =
  DIASPORA_COUNTRIES.reduce((acc, c) => {
    (acc[c.region] ??= []).push(c);
    return acc;
  }, {} as Record<string, DiasporaCountry[]>);
