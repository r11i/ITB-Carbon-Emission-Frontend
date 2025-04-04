"use client";

import { useEffect } from "react";
import L from "leaflet"; // ✅ Import Leaflet
import "leaflet/dist/leaflet.css";

export default function MapComponent() {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const locations = [
        { name: "ITB Jakarta Campus", lat: -6.2341752279143385, lng: 106.83167313631742, address: "Jakarta" },  
        { name: "ITB Ganesha Campus", lat: -6.89018005283179, lng: 107.6101679769993, address: "Bandung" },
        { name: "ITB Jatinangor Campus", lat: -6.92780166772557, lng: 107.76906228476939, address: "Jatinangor" },
        { name: "ITB Cirebon Campus", lat: -6.663976760581004, lng: 108.41587418911303, address: "Cirebon" },
        { name: "Observatorium Bosscha", lat: -6.824860305161196, lng: 107.61654318450398, address: "Lembang" },  
      ];

      // ✅ Inisialisasi Map dengan fokus awal ke ITB Ganesha
      const map = L.map("map", {
        center: [-6.557359408366098, 107.60526502413974], // ITB Ganesha
        zoom: 10, 
        zoomControl: true,
        attributionControl: false,
      });

      // ✅ Tetap Pakai Google Maps Tile Layer
      L.tileLayer(
        "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=YOUR_GOOGLE_MAPS_API_KEY",
        {
          attribution: '&copy; <a href="https://maps.google.com/">Google Maps</a>',
        }
      ).addTo(map);

      // ✅ Custom Icon untuk Marker
      const markerIcon = L.icon({
        iconUrl: "/marker-icon.svg", // Pastikan file ini ada di public/
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      // ✅ Tambahkan marker untuk setiap lokasi
      locations.forEach((location) => {
        const marker = L.marker([location.lat, location.lng], { icon: markerIcon }).addTo(map);

        // ✅ Bind popup dengan informasi lokasi
        marker.bindPopup(`<b>${location.name}</b><br>${location.address}`);

        // ✅ Saat marker diklik, langsung zoom ke lokasi (zoom level 18)
        marker.on("click", () => {
          map.setView([location.lat, location.lng], 18, { animate: false }); // Langsung zoom tanpa animasi bertahap
        });

        // ✅ Tampilkan popup saat hover
        marker.on("mouseover", function () {
          marker.openPopup();
        });

        marker.on("mouseout", function () {
          marker.closePopup();
        });
      });

      return () => {
        map.remove(); // ✅ Hapus map saat komponen di-unmount
      };
    }
  }, []);

  return <div id="map" className="absolute top-12 left-0 w-full h-[calc(100vh-3rem)] z-10"></div>;
}
