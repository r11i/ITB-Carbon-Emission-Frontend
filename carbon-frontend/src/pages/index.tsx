import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";

// --- Impor Komponen dan Tipe Data ---
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-500">Loading map...</div>
});
import { LocationData } from "@/components/MapComponent";

const LocationSidebar = dynamic(() => import("@/components/LocationSidebar"), {
  ssr: false,
  loading: () => null
});
import { BuildingData } from "@/components/LocationSidebar";

// Tipe data API
interface RoomData { [roomName: string]: number; }
interface BuildingDetailData { total_emission: number; rooms: RoomData; }
interface BuildingJsonResponse { buildings: { [buildingName: string]: BuildingDetailData; } }
interface CampusEmissionsResponse { emissions: { [campus: string]: { [yearOrMonth: string]: number } } }

// --- Konstanta ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// --- Mapping Nama Kampus ---
const campusNameMapping: { [key: string]: string } = {
  "ITB Ganesha Campus": "Ganesha",
  "ITB Jatinangor Campus": "Jatinangor",
  "ITB Cirebon Campus": "Cirebon",
  "ITB Jakarta Campus": "Jakarta",
  "Observatorium Bosscha": "Boscha",
};

// --- Komponen Utama ---
export default function Home() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isLocationSidebarOpen, setIsLocationSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [buildingsDataForSidebar, setBuildingsDataForSidebar] = useState<BuildingData[]>([]);
  const [isBuildingDataLoading, setIsBuildingDataLoading] = useState(false);
  const [buildingDataError, setBuildingDataError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>(["All"]);
  const [selectedCampusTotalEmission, setSelectedCampusTotalEmission] = useState<number | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"Summary" | "Buildings">("Summary");

  // --- Fungsi Fetch (Sama seperti sebelumnya) ---
  const fetchAvailableYears = useCallback(async () => { /* ... kode fetch tahun ... */
      console.log("Fetching available years...");
      try {
          const apiUrl = `${API_BASE_URL}/emissions/campus`;
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`Failed to fetch campus data for years (${response.status})`);
          const data: CampusEmissionsResponse = await response.json();
          let years = new Set<string>();
          if (data && data.emissions) {
              Object.values(data.emissions).forEach(campusData => {
                  Object.keys(campusData).forEach(yearOrMonth => {
                      const yearNum = parseInt(yearOrMonth);
                      if (!isNaN(yearNum) && yearNum > 1900) { years.add(yearOrMonth); }
                  });
              });
          }
          const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
          setAvailableYears(["All", ...sortedYears]);
          console.log("Available years set:", ["All", ...sortedYears]);
      } catch (error: any) {
          console.error("Error fetching available years:", error);
          setAvailableYears(["All"]);
      }
  }, []);

  useEffect(() => { fetchAvailableYears(); }, [fetchAvailableYears]);

  const fetchDataForSelectedCampusAndYear = useCallback(async (campusApiName: string, year: string) => { /* ... kode fetch gedung ... */
    if (!campusApiName) return;
    console.log(`Fetching data for: ${campusApiName}, Year: ${year}`);
    setIsBuildingDataLoading(true);
    setBuildingDataError(null);
    setBuildingsDataForSidebar([]);
    setSelectedCampusTotalEmission(null);
    try {
      const apiUrl = `${API_BASE_URL}/emissions/building?campus=${encodeURIComponent(campusApiName)}&year=${encodeURIComponent(year)}`;
      console.log(`Fetching buildings from: ${apiUrl}`);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        let errorMsg = `Failed to fetch building data (${response.status}) for ${campusApiName} (${year})`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
      }
      const data: BuildingJsonResponse = await response.json();
      console.log(`API Response for ${campusApiName} (${year}):`, data);
      let currentCampusTotal = 0;
      let formattedBuildings: BuildingData[] = [];
      if (data && data.buildings && typeof data.buildings === 'object') {
        formattedBuildings = Object.entries(data.buildings)
          .map(([name, details]: [string, BuildingDetailData]) => {
            const emission = (typeof details.total_emission === 'number' && !isNaN(details.total_emission)) ? details.total_emission : 0;
            currentCampusTotal += emission;
            return { name, total_emission: emission, unit: "kg CO₂e" };
          });
        setBuildingsDataForSidebar(formattedBuildings);
        setSelectedCampusTotalEmission(currentCampusTotal);
        console.log(`Data processed for ${campusApiName} (${year}): Buildings=${formattedBuildings.length}, Total=${currentCampusTotal}`);
         if (formattedBuildings.length === 0 && Object.keys(data.buildings).length === 0) {
             console.log(`No building emission records found for ${campusApiName} (${year})`);
         }
      } else {
        console.warn(`Received unexpected or empty 'buildings' data for ${campusApiName} (${year}):`, data);
        setBuildingsDataForSidebar([]);
        setSelectedCampusTotalEmission(0);
        setBuildingDataError(`Unexpected data format received.`);
      }
    } catch (error: any) {
      console.error(`Error fetching data for ${campusApiName} (${year}):`, error);
      setBuildingDataError(error.message || `An error occurred fetching data.`);
      setBuildingsDataForSidebar([]);
      setSelectedCampusTotalEmission(null);
    } finally {
      setIsBuildingDataLoading(false);
    }
  }, []);

  // --- Handler Interaksi ---
  const handleLocationSelect = useCallback((location: LocationData) => { /* ... kode sama ... */
    const campusApiName = campusNameMapping[location.name] || location.name;
    console.log(`Map marker selected: ${location.name} -> API Name: ${campusApiName}`);
    setSelectedLocation(location);
    setIsLocationSidebarOpen(true);
    setActiveSidebarTab("Summary");
    setSelectedYear("All");
    fetchDataForSelectedCampusAndYear(campusApiName, "All");
  }, [fetchDataForSelectedCampusAndYear]);

  // Handler untuk menutup sidebar (dipanggil oleh X sidebar DAN popupclose map)
  const handleCloseLocationSidebar = useCallback(() => {
    console.log("Closing sidebar via handleCloseLocationSidebar...");
    setIsLocationSidebarOpen(false);
  }, []);

  const handleYearChange = useCallback((newYear: string) => { /* ... kode sama ... */
    if (!selectedLocation) return;
    const campusApiName = campusNameMapping[selectedLocation.name] || selectedLocation.name;
    setSelectedYear(newYear);
    fetchDataForSelectedCampusAndYear(campusApiName, newYear);
  }, [selectedLocation, fetchDataForSelectedCampusAndYear]);

  const handleTabChange = (newTab: "Summary" | "Buildings") => { /* ... kode sama ... */
    setActiveSidebarTab(newTab);
  };

  // --- Render Komponen ---
  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Interactive map and building emission ranking for ITB campuses" />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col relative overflow-hidden">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm z-30 sticky top-0 h-16">
           {/* ... (Kode Navbar Lengkap) ... */}
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
             <div className="flex items-center justify-between h-full">
               <div className="flex items-center">
                 <button onClick={() => setIsMobileNavOpen(true)} className="md:hidden -ml-2 mr-2 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500" aria-label="Open navigation menu" aria-expanded={isMobileNavOpen}>
                   <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                 </button>
                 <div className="flex-shrink-0 flex items-center">
                    <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                    <h1 className="ml-2 text-lg font-semibold text-gray-900 hidden sm:block">ITB Carbon Footprint</h1>
                    <h1 className="ml-2 text-lg font-semibold text-gray-900 block sm:hidden">ITB Carbon</h1>
                 </div>
               </div>
               <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                      <Link href="/carbon-dashboard" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</Link>
                      <Link href="/device-table" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Device </Link>
                      <Link href="/about" className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</Link>
                  </div>
               </div>
             </div>
           </div>
        </nav>
        {/* Sidebar Navigasi Mobile */}
        {isMobileNavOpen && (
             <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                 {/* ... (Kode Sidebar Nav Mobile Lengkap) ... */}
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-linear" onClick={() => setIsMobileNavOpen(false)} aria-hidden="true"></div>
                 <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out">
                      <div className="absolute top-0 right-0 -mr-12 pt-2">
                          <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileNavOpen(false)}>
                              <span className="sr-only">Close sidebar</span>
                              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      </div>
                      <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                          <div className="flex-shrink-0 flex items-center px-4">
                              <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                              <span className="ml-2 font-semibold text-gray-800">ITB Carbon Footprint</span>
                          </div>
                          <nav className="mt-6 px-2 space-y-1">
                              <Link href="/" className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsMobileNavOpen(false)}>Map View</Link>
                              <Link href="/carbon-dashboard" className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsMobileNavOpen(false)}>Dashboard</Link>
                              <Link href="/input-data" className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsMobileNavOpen(false)}>Input Data</Link>
                              <Link href="/about" className="group flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => setIsMobileNavOpen(false)}>About</Link>
                          </nav>
                      </div>
                 </div>
                 <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
             </div>
         )}
        {/* Konten Utama */}
        <main className="flex-1 flex relative">
            <div className="flex-1 h-full">
                <MapComponent
                    onLocationSelect={handleLocationSelect}
                    // Teruskan fungsi close sidebar ke MapComponent
                    onMapPopupClose={handleCloseLocationSidebar} // <-- Teruskan handler ini
                 />
            </div>
            {/* Sidebar Detail Lokasi */}
            {selectedLocation && (
                 <LocationSidebar
                    isOpen={isLocationSidebarOpen}
                    onClose={handleCloseLocationSidebar} // Untuk tombol X di sidebar
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
                    imagePlaceholderUrl={`/images/campus-${(campusNameMapping[selectedLocation.name] || 'default').toLowerCase()}.jpg`}
                />
            )}
        </main>
      </div>
    </>
  );
}