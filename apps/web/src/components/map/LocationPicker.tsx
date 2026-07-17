import { MapPin } from 'lucide-react';
import Map, { Marker } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_STYLE_URL } from './map-config';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onPick: (latitude: number, longitude: number) => void;
}

/** Click or drag to set a restaurant's coordinates. Default export for React.lazy. */
export default function LocationPicker({ latitude, longitude, onPick }: LocationPickerProps) {
  // Both map clicks and marker drags carry `lngLat`; a structural param fits both.
  const handlePick = (e: { lngLat: { lat: number; lng: number } }) =>
    onPick(e.lngLat.lat, e.lngLat.lng);

  return (
    <Map
      initialViewState={{ latitude, longitude, zoom: 15 }}
      mapStyle={MAP_STYLE_URL}
      attributionControl={{ compact: true }}
      dragRotate={false}
      style={{ width: '100%', height: '100%' }}
      onClick={handlePick}
    >
      <Marker
        latitude={latitude}
        longitude={longitude}
        anchor="bottom"
        draggable
        onDragEnd={handlePick}
      >
        <MapPin
          className="size-9 fill-primary text-primary-foreground drop-shadow"
          strokeWidth={1.5}
        />
      </Marker>
    </Map>
  );
}
