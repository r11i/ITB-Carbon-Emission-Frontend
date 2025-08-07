"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";


export interface LocationData {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  imageUrl: string;
}

interface MapComponentProps {
  allLocations: LocationData[];
  onLocationSelect: (location: LocationData) => void;
  center: [number, number];
  zoom: number;
  isSidebarOpen: boolean;
  onPopupClose: () => void;
  selectedLocationId: string | number;
}

const customMarkerIcon = L.icon({
  iconUrl: "/map-marker.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      animate: true,
      duration: 1.5,
    });
  }, [center, zoom, map]);
  return null;
}

function PopupStateWatcher({ isOpen, selectedLocationId }: { isOpen: boolean, selectedLocationId: string | number }) {
  const map = useMap();
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      map.closePopup();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, map]);

  useEffect(() => {
    if (selectedLocationId === 'All') {
        map.closePopup();
    }
  }, [selectedLocationId, map]);

  return null;
}

export default function MapComponent({ onLocationSelect, allLocations, center, zoom, isSidebarOpen, onPopupClose, selectedLocationId }: MapComponentProps) {
  const markerRef = useRef<L.Marker | null>(null);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='© <a href="https://maps.google.com/">Google Maps</a>'
        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
      />
      <MapViewUpdater center={center} zoom={zoom} />
      <PopupStateWatcher isOpen={isSidebarOpen} selectedLocationId={selectedLocationId} />

      {allLocations.map((location) => (
        <Marker
          key={location.id}
          position={[location.lat, location.lng]}
          icon={customMarkerIcon}
          title={location.name}
          eventHandlers={{
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onLocationSelect(location);
              e.target.openPopup();
              markerRef.current = e.target;
            },
            mouseover: (e) => e.target.openPopup(),
            mouseout: (e) => {
              if (markerRef.current !== e.target) {
                e.target.closePopup();
              }
            },
            popupclose: (e) => {
              if (markerRef.current === e.target) {
                markerRef.current = null;
              }
              onPopupClose();
            },
          }}
        >
          <Popup autoClose={false} closeOnClick={false} className="custom-leaflet-popup">
            <div className="w-100 max-w-xs">
                <img
                    src={location.imageUrl}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/itb-placeholder.jpg'; }}
                    alt={`Campus image for ${location.name}`}
                    className="w-full h-60 object-cover p-4 mt-4 rounded-lg"
                />
                <div className="p-2.5">
                    <h3 className="text-base font-bold text-slate-800">{location.name}</h3>
                    <p className="text-xs text-slate-600 mt-1">{location.address}</p>
                </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}