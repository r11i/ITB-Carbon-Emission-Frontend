// pages/index.tsx

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

// Dynamic import untuk komponen yang bergantung pada browser
const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false, loading: () => <div className="flex items-center justify-center h-full w-full bg-slate-200"><p className="text-slate-500">Loading map...</p></div> });
import { LocationData } from "@/components/MapComponent";
const LocationSidebar = dynamic(() => import("@/components/LocationSidebar"), { ssr: false, loading: () => null });
import { BuildingData } from "@/components/LocationSidebar";

// Tipe data dan konstanta
interface RoomData { [roomName: string]: number; }
interface BuildingDetailData { total_emission: number; rooms: RoomData; }
interface BuildingJsonResponse { buildings: { [buildingName: string]: BuildingDetailData; } }
interface CampusEmissionsResponse { emissions: { [campus: string]: { [yearOrMonth: string]: number } } }
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const initialGaneshaCampusData: LocationData = { name: "ITB Ganesha Campus", lat: -6.89018, lng: 107.61017, address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132", id: "Ganesha" };


export default function HomePage() {
  const { isLoading: isAuthLoading } = useAuth();
  
  // STATE PENTING: Menyimpan lokasi yang dipilih dari peta
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  
  // STATE KUNCI: Mengontrol apakah sidebar ditampilkan atau tidak
  const [isLocationSidebarOpen, setIsLocationSidebarOpen] = useState(false);
  
  // State lainnya
  const [buildingsDataForSidebar, setBuildingsDataForSidebar] = useState<BuildingData[]>([]);
  const [isBuildingDataLoading, setIsBuildingDataLoading] = useState(false);
  const [buildingDataError, setBuildingDataError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>(["All"]);
  const [selectedCampusTotalEmission, setSelectedCampusTotalEmission] = useState<number | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"Summary" | "Buildings">("Summary");

  // FUNGSI KUNCI: Dipanggil oleh MapComponent saat lokasi diklik.
  // Fungsi ini memperbarui lokasi yang dipilih dan membuka sidebar.
  const handleLocationSelect = useCallback((location: LocationData, openSidebar = true) => {
    setSelectedLocation(location);
    if (openSidebar) {
      setIsLocationSidebarOpen(true); // <-- BARIS INI YANG MEMBUKA SIDEBAR
    }
    setActiveSidebarTab("Summary"); // Reset tab ke Summary setiap kali lokasi baru dipilih
  }, []);

  // Efek untuk memilih lokasi awal saat aplikasi dimuat, tanpa membuka sidebar
  useEffect(() => {
    if (!isAuthLoading && !selectedLocation) {
      handleLocationSelect(initialGaneshaCampusData, false); // `false` mencegah sidebar terbuka saat load
    }
  }, [isAuthLoading, selectedLocation, handleLocationSelect]);

  // Efek untuk mengambil data tahun yang tersedia
  useEffect(() => {
    const fetchAvailableYears = async () => {
        if (!initialGaneshaCampusData.id) return setAvailableYears(["All"]);
        try {
            const apiUrl = `${API_BASE_URL}/emissions/campus?campus=${initialGaneshaCampusData.id}&year=All`;
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            const data: CampusEmissionsResponse = await response.json();
            const yearsSet = new Set<string>();
            const campusData = data.emissions?.[initialGaneshaCampusData.id] || data.emissions;
            if (campusData && typeof campusData === 'object') {
                Object.keys(campusData).forEach(year => !isNaN(parseInt(year)) && yearsSet.add(year));
            }
            const sortedYears = Array.from(yearsSet).sort((a, b) => parseInt(b) - parseInt(a));
            setAvailableYears(["All", ...sortedYears]);
        } catch (e) {
            console.error("Error fetching available years:", e);
            setAvailableYears(["All"]);
        }
    };
    fetchAvailableYears();
  }, []);

  // Efek untuk mengambil data bangunan berdasarkan kampus dan tahun yang dipilih
  const fetchDataForSelectedCampusAndYear = useCallback(async (campusId: string, year: string) => {
    if (!campusId) return;
    setIsBuildingDataLoading(true);
    setBuildingDataError(null);
    try {
      const apiUrl = `${API_BASE_URL}/emissions/building?campus=${encodeURIComponent(campusId)}&year=${encodeURIComponent(year)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      const data: BuildingJsonResponse = await response.json();
      let campusTotal = 0;
      let formattedBuildings: BuildingData[] = [];
      if (data?.buildings && typeof data.buildings === 'object') {
        formattedBuildings = Object.entries(data.buildings).map(([name, details]) => {
          const emission = details.total_emission || 0;
          campusTotal += emission;
          return { name, total_emission: emission, unit: "kg CO₂e" };
        });
      }
      setBuildingsDataForSidebar(formattedBuildings);
      setSelectedCampusTotalEmission(campusTotal);
    } catch (e: any) {
      setBuildingDataError(e.message);
      setBuildingsDataForSidebar([]);
      setSelectedCampusTotalEmission(null);
    } finally {
      setIsBuildingDataLoading(false);
    }
  }, []);

  // Trigger pengambilan data ketika lokasi atau tahun berubah
  useEffect(() => {
    if (selectedLocation?.id) {
      fetchDataForSelectedCampusAndYear(selectedLocation.id, selectedYear);
    }
  }, [selectedLocation, selectedYear, fetchDataForSelectedCampusAndYear]);
  
  // Handler untuk menutup sidebar
  const handleCloseLocationSidebar = useCallback(() => setIsLocationSidebarOpen(false), []);
  const handleYearChange = useCallback((newYear: string) => setSelectedYear(newYear), []);
  const handleTabChange = (newTab: "Summary" | "Buildings") => setActiveSidebarTab(newTab);

  // Tampilan loading aplikasi utama
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-xl text-slate-700">Loading Application...</p>
      </div>
    );
  }

  // Render Halaman
  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Interactive map and building emission ranking for ITB campuses" />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>
      
      <Layout>
        <div className="flex-1 h-[calc(100vh-4rem)]"> 
          <div className="relative h-full w-full">
            <div className="absolute inset-0">
              <MapComponent
                // PROPERTI KUNCI: Memberikan fungsi pembuka sidebar ke MapComponent
                onLocationSelect={handleLocationSelect}
                onMapPopupClose={handleCloseLocationSidebar}
                externallySelectedLocation={selectedLocation}
              />
            </div>
            {selectedLocation && (
              <LocationSidebar
                // PROPERTI KUNCI: Visibilitas sidebar dikontrol oleh state ini
                isOpen={isLocationSidebarOpen}
                onClose={handleCloseLocationSidebar}
                location={selectedLocation}
                buildings={buildingsDataForSidebar}
                isLoading={isBuildingDataLoading}
                error={buildingDataError}
                selectedYear={selectedYear}
                availableYears={availableYears}
                onYearChange={handleYearChange}
                campusTotalEmission={selectedCampusTotalEmission}
                activeTab={activeSidebarTab}
                onTabChange={handleTabChange}
              />
            )}
          </div>
        </div>
      </Layout>
    </>
  );
}