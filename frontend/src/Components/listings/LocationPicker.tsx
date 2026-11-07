import type React from 'react';
import { APIProvider, AdvancedMarker, Map } from '@vis.gl/react-google-maps';

export interface Position {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  center: Position;
  zoom: number;
  position: Position | null;
  onPick: (position: Position) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ center, zoom, position, onPick }) => {
  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-200">
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          key={`${center.lat},${center.lng}`}
          defaultCenter={center}
          defaultZoom={zoom}
          mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
          gestureHandling="greedy"
          onClick={(event) => {
            if (event.detail.latLng) onPick(event.detail.latLng);
          }}
        >
          {position && <AdvancedMarker position={position} />}
        </Map>
      </APIProvider>
    </div>
  );
};
