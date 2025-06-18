"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  address:string;
  id?: string | number;
}

interface MapComponentProps {
  onLocationSelect: (location: LocationData) => void;
  onMapPopupClose?: () => void;
}

export default function MapComponent({
  onLocationSelect,
  onMapPopupClose
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Renamed for clarity: tracks the marker whose popup is currently open and "selected"
  const openPopupMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && mapContainerRef.current) {
      const ganeshaCampusLocation: LocationData = {
        name: "ITB Ganesha Campus",
        lat: -6.89018,
        lng: 107.61017,
        address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung"
      };

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [ganeshaCampusLocation.lat, ganeshaCampusLocation.lng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a>',
          maxZoom: 20,
        }).addTo(mapRef.current);

        L.control.attribution({
          position: 'bottomright',
          prefix: '<a href="https://itb.ac.id" target="_blank">ITB Carbon Footprint</a>'
        }).addTo(mapRef.current);

        L.control.zoom({
          position: 'topright',
          zoomInText: '+',
          zoomOutText: '-',
          zoomInTitle: 'Zoom in',
          zoomOutTitle: 'Zoom out'
        }).addTo(mapRef.current);

        const markerIcon = L.icon({
          iconUrl: "/map-marker.webp",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
          shadowSize: [41, 41],
          shadowAnchor: [12, 41]
        });

        const hoverMarkerIcon = L.icon({
          iconUrl: "/marker-icon-red.svg",
          iconSize: [48, 48],
          iconAnchor: [24, 48],
          popupAnchor: [0, -48],
          shadowUrl: "/marker-shadow.png",
          shadowSize: [41, 41],
          shadowAnchor: [12, 41]
        });

        // Hanya ada satu lokasi sekarang
        const location = ganeshaCampusLocation;
        const marker = L.marker([location.lat, location.lng], {
          icon: markerIcon,
          title: location.name,
          riseOnHover: true
        }).addTo(mapRef.current!);

        marker.bindPopup(`
          <div class="min-w-[220px]">
            <h3 class="text-lg font-bold text-gray-800 mb-1">${location.name}</h3>
            <p class="text-sm text-gray-600 mb-2">${location.address}</p>
          </div>
        `, {
          autoClose: false,       // Penting: jangan tutup otomatis saat popup lain dibuka (meski tidak relevan untuk 1 marker)
          closeOnClick: false,    // Penting: jangan tutup saat marker diklik
          closeButton: true,      // Tampilkan tombol 'X' bawaan Leaflet
          className: "custom-popup",
          maxWidth: 300,
          minWidth: 220
        });

        // --- MODIFIKASI: Buka popup secara default ---
        marker.openPopup();
        openPopupMarkerRef.current = marker;
        onLocationSelect(location); // Panggil onLocationSelect saat pertama kali load
        // --- AKHIR MODIFIKASI ---

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e); // Hentikan event agar tidak langsung ditangkap oleh map click

          // Jika popup tertutup karena suatu hal dan marker diklik lagi
          if (!marker.isPopupOpen()) {
            marker.openPopup();
          }
          
          // Selalu set marker ini sebagai yang aktif dan panggil onLocationSelect
          openPopupMarkerRef.current = marker;
          onLocationSelect(location);

          mapRef.current?.flyTo([location.lat, location.lng], mapRef.current.getZoom(), { // Gunakan zoom saat ini atau zoom yang diinginkan
            duration: 0.6,
            easeLinearity: 0.25
          });

          // Visual feedback
          marker.setIcon(hoverMarkerIcon);
          setTimeout(() => {
            marker.setIcon(markerIcon);
          }, 300);
        });

        marker.on('popupclose', () => {
          // Event ini akan terpanggil ketika popup ditutup (oleh 'X' atau oleh map.closePopup())
          if (openPopupMarkerRef.current === marker) {
            openPopupMarkerRef.current = null; // Reset marker yang popupnya terbuka
            if (onMapPopupClose) onMapPopupClose();
          }
        });

        // Map click event
        mapRef.current.on('click', () => {
          if (openPopupMarkerRef.current && openPopupMarkerRef.current.isPopupOpen()) {
            openPopupMarkerRef.current.closePopup();
            // Event 'popupclose' pada marker akan menangani sisanya
          }
        });
      }

      return () => {
        if (mapRef.current) {
          mapRef.current.off();
          mapRef.current.remove();
          mapRef.current = null;
        }
        openPopupMarkerRef.current = null; // Bersihkan ref saat unmount
      };
    }
  }, [onLocationSelect, onMapPopupClose]); // Dependencies tetap

  return (
    <div
      ref={mapContainerRef}
      id="map"
      className="relative z-0 w-full h-[calc(100vh-4rem)]"
    />
  );
}