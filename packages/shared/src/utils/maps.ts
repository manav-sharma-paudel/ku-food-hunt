/**
 * Google Maps "directions" deep link. Opens the native Maps app with turn-by-turn
 * navigation on mobile, or maps.google.com in the browser — one URL handles both.
 * Including the place ID makes Maps resolve the exact listing, not just a pin.
 */
export function googleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
  placeId?: string | null,
): string {
  const base = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  return placeId ? `${base}&destination_place_id=${placeId}` : base;
}
