import type { Coordinates, MapRestaurantDto } from '@ku-food-hunt/shared';
import maplibregl from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import Map, { Marker, NavigationControl, type MapRef } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { KU_CENTER, MAP_STYLE_URL } from './map-config';
import { RestaurantPin } from './RestaurantPin';

interface MapViewProps {
  restaurants: MapRestaurantDto[];
  selectedId: string | null;
  hoveredId: string | null;
  userCoords: Coordinates | null;
  onSelect: (r: MapRestaurantDto) => void;
  onBackgroundClick: () => void;
}

export function MapView({
  restaurants,
  selectedId,
  hoveredId,
  userCoords,
  onSelect,
  onBackgroundClick,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const fitted = useRef(false);

  function fitToMarkers() {
    const map = mapRef.current;
    if (!map || restaurants.length === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const r of restaurants) bounds.extend([r.longitude, r.latitude]);
    if (userCoords) bounds.extend([userCoords.longitude, userCoords.latitude]);
    map.fitBounds(bounds, { padding: 90, maxZoom: 16, duration: 0 });
  }

  // Fit once markers are available.
  useEffect(() => {
    if (!fitted.current && restaurants.length > 0 && mapRef.current) {
      fitToMarkers();
      fitted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants]);

  // Fly to the user when their location arrives.
  useEffect(() => {
    if (userCoords && mapRef.current) {
      mapRef.current.flyTo({
        center: [userCoords.longitude, userCoords.latitude],
        zoom: 15,
        duration: 1200,
      });
    }
  }, [userCoords]);

  // Center the selected pin so the preview card never hides it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const r = restaurants.find((x) => x.id === selectedId);
    if (r) map.easeTo({ center: [r.longitude, r.latitude], duration: 500 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <Map
      ref={mapRef}
      initialViewState={KU_CENTER}
      mapStyle={MAP_STYLE_URL}
      attributionControl={{ compact: true }}
      onLoad={() => {
        if (!fitted.current && restaurants.length > 0) {
          fitToMarkers();
          fitted.current = true;
        }
      }}
      onClick={onBackgroundClick}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="bottom-right" showCompass={false} />

      {restaurants.map((r) => (
        <Marker
          key={r.id}
          longitude={r.longitude}
          latitude={r.latitude}
          anchor="bottom"
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            onSelect(r);
          }}
        >
          <RestaurantPin open={r.isOpenNow} selected={selectedId === r.id || hoveredId === r.id} />
        </Marker>
      ))}

      {userCoords && (
        <Marker longitude={userCoords.longitude} latitude={userCoords.latitude} anchor="center">
          <span className="relative flex size-4 items-center justify-center">
            <span className="absolute size-8 animate-ping rounded-full bg-[#3b82f6]/30" />
            <span className="size-4 rounded-full border-2 border-white bg-[#3b82f6] shadow-md" />
          </span>
        </Marker>
      )}
    </Map>
  );
}
