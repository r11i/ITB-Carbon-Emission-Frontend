"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipe data untuk lokasi
export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  address: string;
  id?: string | number;
}

// Props untuk MapComponent
interface MapComponentProps {
  onLocationSelect: (location: LocationData) => void; // Saat marker diklik (buka sidebar)
  onMapPopupClose?: () => void; // Callback saat popup map ditutup (tutup sidebar)
}

export default function MapComponent({
  onLocationSelect,
  onMapPopupClose
}: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Ref untuk melacak marker mana yang popupnya dibuka karena KLIK
  const clickedMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && mapContainerRef.current) {
      const locations: LocationData[] = [
        { name: "ITB Jakarta Campus", lat: -6.234175, lng: 106.831673, address: "Graha Irama (Indorama), Jl. H. R. Rasuna Said No.Kav. 1-2, RT.6/RW.7, Kuningan Tim., Kecamatan Setiabudi, Kota Jakarta Selatan" },
        { name: "ITB Ganesha Campus", lat: -6.89018, lng: 107.61017, address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung" },
        { name: "ITB Jatinangor Campus", lat: -6.92780, lng: 107.76906, address: "Jl. Letjen Purn.Dr.(HC). Mashudi No.1, Sayang, Kec. Jatinangor, Kabupaten Sumedang" },
        { name: "ITB Cirebon Campus", lat: -6.66397, lng: 108.41587, address: "Jl. Kebonturi, Arjawinangun, Kec. Arjawinangun, Kabupaten Cirebon" },
        { name: "Observatorium Bosscha", lat: -6.82486, lng: 107.61654, address: "Jl. Peneropongan Bintang No.45, Lembang, Kabupaten Bandung Barat" },
      ];

      if (!mapRef.current) {
        mapRef.current = L.map(mapContainerRef.current, {
          center: [-6.7, 107.6],
          zoom: 9,
          zoomControl: true,
          attributionControl: false,
        });

        L.tileLayer("https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}", {
          attribution: '© <a href="https://maps.google.com/">Google Maps</a>',
          maxZoom: 20,
        }).addTo(mapRef.current);

        const markerIcon = L.icon({
          iconUrl: "/marker-icon.svg",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        });

        locations.forEach((location) => {
          const marker = L.marker([location.lat, location.lng], { icon: markerIcon, title: location.name })
            .addTo(mapRef.current!);

          // Bind popup - jangan auto close, jangan close on click map
          marker.bindPopup(`<b>${location.name}</b><br>${location.address}`, {
            autoClose: false,
            closeOnClick: false,
            closeButton: true // Tampilkan tombol X internal popup
          });

          // === Event saat marker di-KLIK ===
          marker.on("click", (e) => {
            L.DomEvent.stopPropagation(e);
            console.log(`CLICKED: ${location.name} - Opening persistent popup & sidebar`);

            // Tutup popup lain yang mungkin terbuka karena KLIK sebelumnya
            if (clickedMarkerRef.current && clickedMarkerRef.current !== marker) {
                console.log("Closing previously clicked marker's popup.");
                clickedMarkerRef.current.closePopup(); // Ini akan memicu popupclose event
            }

            mapRef.current?.setView([location.lat, location.lng], 16, { animate: true, duration: 0.6 });
            marker.openPopup(); // Buka popup ini
            clickedMarkerRef.current = marker; // Tandai sebagai yang diklik

            onLocationSelect(location); // Buka sidebar
          });

          // === Event saat mouse HOVER ===
          marker.on('mouseover', () => {
            // Hanya buka jika TIDAK ada popup lain yang terbuka karena KLIK
            // dan popup marker ini sendiri belum terbuka
            if (!clickedMarkerRef.current && !marker.isPopupOpen()) {
                 console.log(`HOVER: Opening temporary popup for ${location.name}`);
                marker.openPopup();
            } else if (clickedMarkerRef.current === marker) {
                 console.log(`HOVER: Popup for ${location.name} already open due to click.`);
            } else {
                 console.log(`HOVER: Another popup (${clickedMarkerRef.current?._leaflet_id}) is open due to click. Ignoring hover for ${location.name}`);
            }
          });

          // === Event saat mouse KELUAR dari marker ===
          marker.on('mouseout', () => {
            // Hanya tutup jika popup ini TIDAK dibuka karena KLIK
            if (clickedMarkerRef.current !== marker) {
                 console.log(`MOUSEOUT: Closing temporary popup for ${location.name}`);
                marker.closePopup();
            } else {
                 console.log(`MOUSEOUT: Popup for ${location.name} was opened by click, keeping it open.`);
            }
          });

          // === Event saat popup BENAR-BENAR ditutup (oleh tombol X internal / map.closePopup) ===
          marker.on('popupclose', () => {
              console.log(`POPUP CLOSED: ${location.name}`);
              const wasClicked = clickedMarkerRef.current === marker;

              // Reset state 'clicked' jika popup yang ditutup adalah yang diklik
              if (wasClicked) {
                  console.log("Resetting clickedMarkerRef.");
                  clickedMarkerRef.current = null;
              }

              // Panggil penutup sidebar HANYA jika popup yang ditutup adalah yang diklik
              // atau jika onMapPopupClose selalu ingin dipanggil (sesuaikan logikanya)
              if (wasClicked && onMapPopupClose) {
                   console.log("Calling onMapPopupClose because the 'clicked' popup was closed.");
                   onMapPopupClose(); // Tutup sidebar
              } else if (onMapPopupClose && !wasClicked){
                   console.log("Popup closed, but it wasn't the 'clicked' one. Sidebar state unchanged by this event.");
                   // Jika ingin SEMUA popup close (termasuk yg hover) menutup sidebar,
                   // hapus kondisi 'wasClicked' di atas.
                   // onMapPopupClose();
              }
          });

        }); // End locations.forEach

        // Listener klik pada peta untuk menutup popup yang mungkin terbuka karena klik
        mapRef.current.on('click', () => {
            console.log("Map clicked.");
            if (clickedMarkerRef.current) {
                 console.log("Closing the 'clicked' popup via map click.");
                 // Menutup popup ini akan memicu 'popupclose' event di atas
                 clickedMarkerRef.current.closePopup();
            }
        });

      } // End if (!mapRef.current)

      return () => {
          // Cleanup listeners jika perlu
          // if (mapRef.current) {
          //     mapRef.current.off('click');
          // }
      };
    }
  }, [onLocationSelect, onMapPopupClose]); // Tambahkan kembali onMapPopupClose

  return (
    <div
      ref={mapContainerRef}
      id="map"
      className="relative z-0 w-full h-[calc(100vh-4rem)]"
    />
  );
}