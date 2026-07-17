import Map, { Marker } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { MAP_STYLE_URL } from './map-config';
import { RestaurantPin } from './RestaurantPin';

interface DetailMiniMapProps {
  latitude: number;
  longitude: number;
  open: boolean;
}

/** Single-marker map for the detail Location section. Default export for React.lazy. */
export default function DetailMiniMap({ latitude, longitude, open }: DetailMiniMapProps) {
  return (
    <Map
      initialViewState={{ latitude, longitude, zoom: 15 }}
      mapStyle={MAP_STYLE_URL}
      attributionControl={{ compact: true }}
      dragRotate={false}
      style={{ width: '100%', height: '100%' }}
    >
      <Marker latitude={latitude} longitude={longitude} anchor="bottom">
        <RestaurantPin open={open} selected={false} />
      </Marker>
    </Map>
  );
}
