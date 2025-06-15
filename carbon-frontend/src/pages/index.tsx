// pages/index.tsx
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

// --- Dynamic Imports dengan Loading State yang Lebih Baik ---
const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-slate-200"><p className="text-slate-500">Loading map...</p></div>,
});
import { LocationData } from "@/components/MapComponent";

const LocationSidebar = dynamic(() => import("@/components/LocationSidebar"), {
  ssr: false,
  loading: () => null,
});
import { BuildingData } from "@/components/LocationSidebar";

// --- Tipe Data API & Konstanta ---
interface RoomData { [roomName: string]: number; }
interface BuildingDetailData { total_emission: number; rooms: RoomData; }
interface BuildingJsonResponse { buildings: { [buildingName: string]: BuildingDetailData; } }
interface CampusEmissionsResponse { emissions: { [campus: string]: { [yearOrMonth: string]: number } } }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const initialGaneshaCampusData: LocationData = { name: "ITB Ganesha Campus", lat: -6.89018, lng: 107.61017, address: "Jl. Ganesa No.10, Lb. Siliwangi, Kecamatan Coblong, Kota Bandung, Jawa Barat 40132", id: "Ganesha" };
const ADMIN_EMAIL = "carbonemissiondashboarda@gmail.com";

// --- Komponen Dropdown Item yang Disederhanakan ---
interface DropdownItemProps { href?: string; onClick?: () => void; children: React.ReactNode; }
const DropdownItem: React.FC<DropdownItemProps> = ({ href, onClick, children }) => {
  const classNames = "block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors";
  if (href) {
    return <Link href={href} legacyBehavior><a className={classNames}>{children}</a></Link>;
  }
  return <button onClick={onClick} className={classNames}>{children}</button>;
};

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isAdmin, logout, user, isLoading: isAuthLoading } = useAuth();
  const isSuperAdmin = isAuthenticated && user?.email === ADMIN_EMAIL;

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isLocationSidebarOpen, setIsLocationSidebarOpen] = useState(false);
  const [buildingsDataForSidebar, setBuildingsDataForSidebar] = useState<BuildingData[]>([]);
  const [isBuildingDataLoading, setIsBuildingDataLoading] = useState(false);
  const [buildingDataError, setBuildingDataError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>(["All"]);
  const [selectedCampusTotalEmission, setSelectedCampusTotalEmission] = useState<number | null>(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState<"Summary" | "Buildings">("Summary");

  // --- Logika Fetching Data (Tidak diubah, hanya di-collapse untuk keterbacaan) ---
  const handleLocationSelect=useCallback((l:LocationData,oS=true)=>{setSelectedLocation(l);if(oS)setIsLocationSidebarOpen(true);setActiveSidebarTab("Summary")},[]);
  useEffect(()=>{if(!isAuthLoading&&!selectedLocation){handleLocationSelect(initialGaneshaCampusData,false)}},[isAuthLoading,selectedLocation,handleLocationSelect]);
  const fetchAvailableYears=useCallback(async()=>{if(!initialGaneshaCampusData.id){setAvailableYears(["All"]);return}try{const cI=initialGaneshaCampusData.id;const aU=`${API_BASE_URL}/emissions/campus?campus=${cI}&year=All`;const r=await fetch(aU);if(!r.ok)throw new Error(`API ${r.status}`);const d:CampusEmissionsResponse=await r.json();let yS=new Set<string>();if(d&&d.emissions&&d.emissions[cI]){Object.keys(d.emissions[cI]).forEach(y=>{if(!isNaN(parseInt(y)))yS.add(y)})}else if(d&&d.emissions&&typeof d.emissions==='object'&&!d.emissions[cI]){Object.keys(d.emissions).forEach(y=>{if(!isNaN(parseInt(y)))yS.add(y)})}const sY=Array.from(yS).sort((a,b)=>parseInt(b)-parseInt(a));setAvailableYears(["All",...sY])}catch(e){console.error("Err fetch years:",e);setAvailableYears(["All"])}},[]);
  useEffect(()=>{fetchAvailableYears()},[fetchAvailableYears]);
  const fetchDataForSelectedCampusAndYear=useCallback(async(cAI:string,y:string)=>{if(!cAI)return;setIsBuildingDataLoading(true);setBuildingDataError(null);try{const aU=`${API_BASE_URL}/emissions/building?campus=${encodeURIComponent(cAI)}&year=${encodeURIComponent(y)}`;const r=await fetch(aU);if(!r.ok)throw new Error(`API ${r.status}`);const d:BuildingJsonResponse=await r.json();let cCT=0;let fB:BuildingData[]=[];if(d&&d.buildings&&typeof d.buildings==='object'){fB=Object.entries(d.buildings).map(([n,dtls])=>{const em=dtls.total_emission||0;cCT+=em;return{name:n,total_emission:em,unit:"kg CO₂e"}})}setBuildingsDataForSidebar(fB);setSelectedCampusTotalEmission(cCT)}catch(e:any){setBuildingDataError(e.message);setBuildingsDataForSidebar([]);setSelectedCampusTotalEmission(null)}finally{setIsBuildingDataLoading(false)}},[]);
  useEffect(()=>{if(selectedLocation&&selectedLocation.id){fetchDataForSelectedCampusAndYear(selectedLocation.id as string,selectedYear)}},[selectedLocation,selectedYear,fetchDataForSelectedCampusAndYear]);
  const handleCloseLocationSidebar=useCallback(()=>setIsLocationSidebarOpen(false),[]);
  const handleYearChange=useCallback((nY:string)=>setSelectedYear(nY),[]);
  const handleTabChange=(nT:"Summary"|"Buildings")=>setActiveSidebarTab(nT);
  // --- Akhir Logika Fetching Data ---

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
        <p className="ml-4 text-xl text-slate-700">Loading Application...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Interactive map and building emission ranking for ITB campuses" />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>
      <div className="min-h-screen bg-slate-100 flex flex-col relative overflow-hidden font-sans">
        {/* --- Navbar yang Diperbarui --- */}
        <nav className="bg-white/80 backdrop-blur-md shadow-sm z-30 sticky top-0 h-16 border-b border-slate-200/80">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex items-center justify-between h-full">
              {/* Left Section */}
              <div className="flex items-center space-x-4">
                <button onClick={() => setIsMobileNavOpen(true)} className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Open navigation menu">
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
                <Link href="/" legacyBehavior>
                    <a className="flex-shrink-0 flex items-center space-x-3">
                        <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                        <h1 className="text-xl font-bold text-slate-800 hidden sm:block">ITB Carbon Footprint</h1>
                        <h1 className="text-lg font-bold text-slate-800 block sm:hidden">ITB Carbon</h1>
                    </a>
                </Link>
              </div>

              {/* Center/Desktop Navigation */}
              <div className="hidden md:flex md:items-center md:space-x-2">
                <Link href="/" legacyBehavior><a className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Map View</a></Link>
                <Link href="/carbon-dashboard" legacyBehavior><a className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Dashboard</a></Link>
                {isAuthenticated && (
                  <Link href="/device-table" legacyBehavior><a className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">Devices</a></Link>
                )}
                <Link href="/about" legacyBehavior><a className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a></Link>
              </div>

              {/* Right Section */}
              <div className="hidden md:flex md:items-center md:space-x-4">
                {isAuthenticated ? (
                  <div className="relative">
                    <button onClick={() => setIsUserDropdownOpen(prev => !prev)} className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                      {user?.email ? user.email.split('@')[0] : "Menu"}
                      <svg className={`ml-1 h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </button>
                    {isUserDropdownOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-40" onMouseLeave={() => setIsUserDropdownOpen(false)}>
                        {isSuperAdmin && ( <DropdownItem href="/register">User Management</DropdownItem> )}
                        <DropdownItem onClick={logout}>Logout</DropdownItem>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/login" legacyBehavior>
                    <a className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">Login</a>
                  </Link>
                )}
              </div>
              <div className="md:hidden flex-shrink-0">
                  {/* Placeholder to balance the flexbox on mobile */}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Panel */}
        {isMobileNavOpen && (
            <div className="fixed inset-0 z-40 flex md:hidden" role="dialog" aria-modal="true">
                <div className="fixed inset-0 bg-gray-800 bg-opacity-75" onClick={() => setIsMobileNavOpen(false)} aria-hidden="true"></div>
                <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                        <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileNavOpen(false)}>
                            <span className="sr-only">Close sidebar</span>
                            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                        <div className="flex-shrink-0 flex items-center px-4"><img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo"/><span className="ml-3 text-xl font-bold text-gray-900">ITB Carbon</span></div>
                        <nav className="mt-6 px-2 space-y-1">
                            <Link href="/" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">Map View</a></Link>
                            <Link href="/carbon-dashboard" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">Dashboard</a></Link>
                            {isAuthenticated && (<Link href="/device-table" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">Devices</a></Link>)}
                            <Link href="/about" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">About</a></Link>
                            <div className="pt-4 mt-4 border-t border-gray-200">
                                {isAuthenticated ? (
                                <>
                                    {isSuperAdmin && (<Link href="/register" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">User Management</a></Link>)}
                                    <button onClick={() => {logout(); setIsMobileNavOpen(false)}} className="w-full text-left group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600">Logout {user?.email ? `(${user.email.split('@')[0]})` : ''}</button>
                                </>) : (
                                    <Link href="/login" legacyBehavior><a onClick={() => setIsMobileNavOpen(false)} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">Login</a></Link>
                                )}
                            </div>
                        </nav>
                    </div>
                </div>
                <div className="flex-shrink-0 w-14"></div>
            </div>
        )}

        <main className="flex-1 flex relative h-[calc(100vh-4rem)]">
          <div className="flex-1 h-full bg-slate-300">
            <MapComponent
              onLocationSelect={handleLocationSelect}
              onMapPopupClose={handleCloseLocationSidebar}
              externallySelectedLocation={selectedLocation}
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
            />
          )}
        </main>
      </div>
    </>
  );
}