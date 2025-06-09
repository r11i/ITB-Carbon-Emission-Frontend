// File: index.tsx (atau pages/index.tsx atau app/page.tsx)

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation"; // For App router
// import { useRouter } from "next/router"; // For Pages router

// --- Impor Komponen dan Tipe Data ---
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-500">Loading map...</div>
});
// Pastikan LocationData diimpor dari MapComponent jika belum
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

const reverseCampusMapping: { [key: string]: string } = Object.fromEntries(
  Object.entries(campusNameMapping).map(([k, v]) => [v, k])
);

// Data untuk ITB Ganesha Campus sebagai default
const initialGaneshaCampusData: LocationData = {
  name: "ITB Ganesha Campus",
  lat: -6.89018,
  lng: 107.61017,
  address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung"
};


// --- Komponen Utama ---
export default function Home() {
  const router = useRouter();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialGaneshaCampusData);
  const [isLocationSidebarOpen, setIsLocationSidebarOpen] = useState(true);
  const [buildingsDataForSidebar, setBuildingsDataForSidebar] = useState<BuildingData[]>([]);
  const [isBuildingDataLoading, setIsBuildingDataLoading] = useState(false);
  const [buildingDataError, setBuildingDataError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>(["All"]);
  const [selectedCampusTotalEmission, setSelectedCampusTotalEmission] = useState<number | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"Summary" | "Buildings">("Summary");
  const [allCampuses, setAllCampuses] = useState<LocationData[]>([]);

  useEffect(() => {
    const campusesForSidebarSelection: LocationData[] = [
      { name: "ITB Ganesha Campus", lat: -6.89018, lng: 107.61017, address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung" },
      { name: "ITB Jatinangor Campus", lat: -6.92780, lng: 107.76906, address: "Jl. Letjen Purn.Dr.(HC). Mashudi No.1, Sayang, Kec. Jatinangor, Kabupaten Sumedang" },
      { name: "ITB Cirebon Campus", lat: -6.66397, lng: 108.41587, address: "Jl. Kebonturi, Arjawinangun, Kec. Arjawinangun, Kabupaten Cirebon" },
      { name: "ITB Jakarta Campus", lat: -6.234175, lng: 106.831673, address: "Graha Irama (Indorama), Jl. H. R. Rasuna Said No.Kav. 1-2, RT.6/RW.7, Kuningan Tim., Kecamatan Setiabudi, Kota Jakarta Selatan" },
    ];
    setAllCampuses(campusesForSidebarSelection);
  }, []);

  const fetchAvailableYears = useCallback(async () => {
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
    } catch (error: any) {
      console.error("Error fetching available years:", error);
      setAvailableYears(["All"]);
    }
  }, []);

  useEffect(() => { fetchAvailableYears(); }, [fetchAvailableYears]);

  const fetchDataForSelectedCampusAndYear = useCallback(async (campusApiName: string, year: string) => {
    if (!campusApiName) return;
    setIsBuildingDataLoading(true);
    setBuildingDataError(null);
    try {
      const apiUrl = `${API_BASE_URL}/emissions/building?campus=${encodeURIComponent(campusApiName)}&year=${encodeURIComponent(year)}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        let errorMsg = `Failed to fetch building data (${response.status}) for ${campusApiName} (${year})`;
        try { const errorData = await response.json(); errorMsg = errorData.error || errorMsg; } catch (e) { /* ignore */ }
        throw new Error(errorMsg);
      }
      const data: BuildingJsonResponse = await response.json();
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
        if (formattedBuildings.length === 0 && Object.keys(data.buildings).length === 0) {
          console.log(`No building emission records found for ${campusApiName} (${year})`);
        }
      } else {
        setBuildingsDataForSidebar([]);
        setSelectedCampusTotalEmission(0);
        setBuildingDataError(`Unexpected data format received.`);
      }
    } catch (error: any) {
      setBuildingDataError(error.message || `An error occurred fetching data.`);
      setBuildingsDataForSidebar([]);
      setSelectedCampusTotalEmission(null);
    } finally {
      setIsBuildingDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      const campusApiName = campusNameMapping[selectedLocation.name] || selectedLocation.name;
      fetchDataForSelectedCampusAndYear(campusApiName, selectedYear);
    } else {
      setBuildingsDataForSidebar([]);
      setSelectedCampusTotalEmission(null);
      setBuildingDataError(null);
    }
  }, [selectedLocation, selectedYear, fetchDataForSelectedCampusAndYear]);

  const handleLocationSelect = useCallback((location: LocationData) => {
    setSelectedLocation(location);
    setIsLocationSidebarOpen(true);
    setActiveSidebarTab("Summary");
  }, []);

  const handleCloseLocationSidebar = useCallback(() => {
    setIsLocationSidebarOpen(false);
  }, []);

  const handleYearChange = useCallback((newYear: string) => {
    if (!selectedLocation) return;
    setSelectedYear(newYear);
  }, [selectedLocation]);

  const handleTabChange = (newTab: "Summary" | "Buildings") => {
    setActiveSidebarTab(newTab);
  };

  const handleSelectOtherCampus = (campusName: string) => {
    const fullCampusName = reverseCampusMapping[campusName] || campusName;
    const campus = allCampuses.find(c => c.name === fullCampusName);
    if (campus) {
      const locationToSelect: LocationData = {
        name: campus.name,
        lat: campus.lat,
        lng: campus.lng,
        address: campus.address,
      };
      handleLocationSelect(locationToSelect);
    }
  };

  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Interactive map and building emission ranking for ITB campuses" />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>
      <div className="min-h-screen bg-gray-100 flex flex-col relative overflow-hidden">
        <nav className="bg-gradient-to-r from-blue-800 to-blue-600 shadow-lg z-30 sticky top-0 h-16">
           <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setIsMobileNavOpen(true)}
                  className="md:hidden p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Open navigation menu"
                  aria-expanded={isMobileNavOpen}
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="flex-shrink-0 flex items-center">
                  <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                  <h1 className="ml-3 text-xl font-bold text-white hidden sm:block">ITB Carbon Footprint</h1>
                  <h1 className="ml-3 text-lg font-bold text-white block sm:hidden">ITB Carbon</h1>
                </div>
              </div>

              <div className="hidden md:block">
                <div className="ml-10 flex items-center space-x-4">
                  <Link href="/" className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200">
                    <span className="relative group">
                      Map View
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                    </span>
                  </Link>

                  <Link
                    href="/carbon-dashboard"
                    className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    <span className="relative group">
                      Dashboard
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                    </span>
                  </Link>
                  <Link
                    href="/device-table"
                    className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                     <span className="relative group">
                      Devices
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                    </span>
                  </Link>
                  <Link
                    href="/about"
                    className="text-blue-100 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    <span className="relative group">
                      About
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-200 group-hover:w-full"></span>
                    </span>
                  </Link>
                </div>
              </div>
              {/* Mobile menu button only, login removed */}
              <div className="md:hidden ml-2">
                {/* Placeholder if needed, or remove entirely if the hamburger is enough */}
              </div>
            </div>
          </div>
        </nav>

        {isMobileNavOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
            <div
              className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity duration-300 ease-linear"
              onClick={() => setIsMobileNavOpen(false)}
              aria-hidden="true"
            ></div>

            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <div className="flex-shrink-0 flex items-center px-4">
                  <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                  <span className="ml-3 text-xl font-bold text-gray-900">ITB Carbon</span>
                </div>

                <nav className="mt-6 px-2 space-y-1">
                  <Link
                    href="/"
                    className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <svg className="mr-4 h-6 w-6 text-gray-400 group-hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    Map View
                  </Link>

                  <Link
                    href="/carbon-dashboard"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-left"
                  >
                    <svg className="mr-4 h-6 w-6 text-gray-400 group-hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Dashboard
                  </Link>

                  <Link
                    href="/device-table"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-left"
                  >
                    <svg className="mr-4 h-6 w-6 text-gray-400 group-hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Devices
                  </Link>

                  <Link
                    href="/about"
                    onClick={() => setIsMobileNavOpen(false)}
                    className="w-full group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 text-left"
                  >
                     <svg className="mr-4 h-6 w-6 text-gray-400 group-hover:text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    About
                  </Link>
                </nav>
              </div>
            </div>

            <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
          </div>
        )}

        <main className="flex-1 flex relative">
          <div className="flex-1 h-full">
            <MapComponent
              onLocationSelect={handleLocationSelect}
              onMapPopupClose={handleCloseLocationSidebar}
              initiallySelectedLocationName={initialGaneshaCampusData.name}
            />
          </div>

          {selectedLocation && (
            <LocationSidebar
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
              imagePlaceholderUrl={`/images/campus-${(campusNameMapping[selectedLocation.name] || 'default').toLowerCase()}.jpg`}
              availableCampuses={Object.values(campusNameMapping)}
              onSelectCampus={handleSelectOtherCampus}
            />
          )}
        </main>
      </div>
    </>
  );
}