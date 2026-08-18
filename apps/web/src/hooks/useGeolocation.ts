import { useCallback, useMemo, useState } from 'react';

import type { Coordinates } from '@ku-food-hunt/shared';

export type GeolocationStatus = 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable';

interface GeolocationState {
  coords: Coordinates | null;
  status: GeolocationStatus;
  request: () => void;
}

/**
 * On-demand geolocation. We never request on load — only when the user opts in
 * (e.g. enabling the distance filter), and coordinates never leave the browser.
 */
export function useGeolocation(): GeolocationState {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>('idle');

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setStatus('unavailable');
      return;
    }
    setStatus('prompting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  // Stable object identity: consumers put `geo` in effect deps, so returning a
  // fresh object every render would re-run those effects on every render.
  return useMemo(() => ({ coords, status, request }), [coords, status, request]);
}
