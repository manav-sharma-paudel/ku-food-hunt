import { KU_COORDINATES } from '@ku-food-hunt/shared';

/**
 * Free OpenFreeMap vector tiles + style — no API key, no billing (blueprint ADR
 * 0003). "positron" is a light, low-chroma basemap that lets the paprika pins pop.
 * Swappable for a Google Cloud Map ID later if billing is ever set up.
 */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const KU_CENTER = {
  longitude: KU_COORDINATES.longitude,
  latitude: KU_COORDINATES.latitude,
  zoom: 14.5,
} as const;

/** Attribution required by OpenStreetMap's data license. */
export const MAP_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>';
