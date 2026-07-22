import type { GeoPoint } from "./types"

export type City = { label: string; value: string; point: GeoPoint }

/**
 * Preset city centers, computed from the real dataset (mean of each city's
 * restaurant coordinates). These are the highest-density markets so the
 * geo-ranking demo always has plenty of nearby results.
 */
export const CITIES: City[] = [
  { label: "New York", value: "New York", point: { lat: 40.7484, lng: -73.9854 } },
  { label: "San Francisco", value: "San Francisco", point: { lat: 37.7837, lng: -122.4211 } },
  { label: "Houston", value: "Houston", point: { lat: 29.7578, lng: -95.443 } },
  { label: "San Diego", value: "San Diego", point: { lat: 32.763, lng: -117.1734 } },
  { label: "Denver", value: "Denver", point: { lat: 39.7343, lng: -104.9794 } },
  { label: "Portland", value: "Portland", point: { lat: 45.5231, lng: -122.6693 } },
  { label: "Scottsdale", value: "Scottsdale", point: { lat: 33.5712, lng: -111.9183 } },
  { label: "Las Vegas", value: "Las Vegas", point: { lat: 36.1226, lng: -115.1788 } },
]
