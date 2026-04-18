import type React from 'react';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Maximize2, Minimize2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

/** SLIIT Malabe campus — map is centered here; pins should be placed on/near campus. */
export const SLIIT_CAMPUS_CENTER: [number, number] = [6.91485, 79.97228];

const DEFAULT_MAP_HEIGHT_PX = 420;

/** OSM tiles are native to ~19; higher zooms scale those tiles for closer campus pinning. */
const MAP_MIN_ZOOM = 15;
const MAP_DEFAULT_ZOOM = 18;
const MAP_MAX_ZOOM = 22;
const TILE_MAX_NATIVE_ZOOM = 19;

function fixLeafletDefaultIcons() {
  const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
  delete proto._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Leaflet needs a size refresh when the map container grows (e.g. maximize). */
function MapInvalidateOnLayoutChange({ layoutKey }: { layoutKey: boolean }) {
  const map = useMap();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      map.invalidateSize();
      window.requestAnimationFrame(() => map.invalidateSize());
    });
    return () => window.cancelAnimationFrame(id);
  }, [map, layoutKey]);
  return null;
}

type Props = {
  position: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
  interactive?: boolean;
};

export const IncidentLocationMapPicker: React.FC<Props> = ({ position, onChange, interactive = true }) => {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  useEffect(() => {
    if (!maximized) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMaximized(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [maximized]);

  const center: [number, number] = position ? [position.lat, position.lng] : SLIIT_CAMPUS_CENTER;

  return (
    <div
      className={
        maximized
          ? 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-3 sm:p-6'
          : 'relative w-full'
      }
      role={maximized ? 'dialog' : undefined}
      aria-modal={maximized ? true : undefined}
      aria-label={maximized ? 'Expanded campus map' : undefined}
      onClick={maximized ? (e) => e.target === e.currentTarget && setMaximized(false) : undefined}
    >
      <div
        className={maximized ? 'w-full max-w-6xl rounded-2xl bg-white p-2 sm:p-3 shadow-xl' : 'w-full'}
        onClick={maximized ? (e) => e.stopPropagation() : undefined}
      >
        <div
          className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-inner z-0"
          style={{
            height: maximized ? 'min(88vh, calc(100dvh - 5rem))' : DEFAULT_MAP_HEIGHT_PX,
            minHeight: maximized ? 320 : undefined,
          }}
        >
          <button
            type="button"
            onClick={() => setMaximized((m) => !m)}
            className="absolute top-2 right-2 z-[1000] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white/95 p-2 text-slate-700 shadow-sm hover:bg-white hover:text-slate-900 transition-colors"
            aria-label={maximized ? 'Restore map size' : 'Maximize map'}
            title={maximized ? 'Exit fullscreen' : 'Maximize map'}
          >
            {maximized ? <Minimize2 size={18} strokeWidth={2} /> : <Maximize2 size={18} strokeWidth={2} />}
          </button>
          <MapContainer
            center={center}
            zoom={MAP_DEFAULT_ZOOM}
            minZoom={MAP_MIN_ZOOM}
            maxZoom={MAP_MAX_ZOOM}
            className="h-full w-full"
            scrollWheelZoom
            doubleClickZoom
            zoomControl
          >
            <MapInvalidateOnLayoutChange layoutKey={maximized} />
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={MAP_MAX_ZOOM}
              maxNativeZoom={TILE_MAX_NATIVE_ZOOM}
            />
            {interactive ? <MapClickHandler onPick={onChange} /> : null}
            {position ? (
              <Marker
                position={[position.lat, position.lng]}
                draggable={interactive}
                eventHandlers={interactive ? {
                  dragend: (e) => {
                    const ll = (e.target as L.Marker).getLatLng();
                    onChange(ll.lat, ll.lng);
                  },
                } : undefined}
              />
            ) : null}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
