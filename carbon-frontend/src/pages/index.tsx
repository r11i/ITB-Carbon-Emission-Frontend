"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

export interface LocationData {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  imageUrl: string;
}

export interface BuildingData {
  name: string;
  total_emission: number;
  rooms?: { [roomName: string]: number };
}

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full w-full bg-slate-200"><p className="text-slate-500">Loading map...</p></div>
});
const LocationSidebar = dynamic(() => import("@/components/LocationSidebar"), { ssr: false });

interface CampusEmissionsResponse {
    total_emissions: { [campus: string]: number; };
    emissions: { [campus: string]: { [year: string]: number; }; };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ALL_CAMPUS_LOCATIONS: LocationData[] = [
    { id: "Ganesha", name: "ITB Ganesha Campus", lat: -6.89018, lng: 107.61017, address: "Jl. Ganesa No.10", imageUrl: "/itb-gane.jpg" },
    { id: "Jatinangor", name: "ITB Jatinangor Campus", lat: -6.92780, lng: 107.76906, address: "Jl. Letjen Purn.Dr.(HC). Mashudi No.1", imageUrl: "/itb-jatinangor.jpg" },
    { id: "Cirebon", name: "ITB Cirebon Campus", lat: -6.66397, lng: 108.41587, address: "Jl. Kebonturi, Arjawinangun", imageUrl: "/itb-cirebon.jpg" },
    { id: "Jakarta", name: "ITB Jakarta Campus", lat: -6.234175, lng: 106.831673, address: "Graha Irama (Indorama)", imageUrl: "/itb-jakarta.jpg" },
];

const OVERVIEW_LOCATION: LocationData = { id: "All", name: "All ITB Campuses", lat: -6.7, lng: 107.6, address: "Dashboard view for all campuses", imageUrl: "/images/itb-placeholder.jpg" };
const OVERVIEW_MAP_VIEW = { center: [-6.78, 107.8] as [number, number], zoom: 9 };
const FOCUSED_MAP_VIEW_ZOOM = 16;

export default function HomePage() {
  const { isLoading: isAuthLoading } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState<LocationData>(OVERVIEW_LOCATION);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [buildingsData, setBuildingsData] = useState<BuildingData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>(["All"]);
  const [mapView, setMapView] = useState(OVERVIEW_MAP_VIEW);
  const [campusTotalEmission, setCampusTotalEmission] = useState<number | null>(null);
  const [campusTotalEmissionPrevYear, setCampusTotalEmissionPrevYear] = useState<number | null>(null);

  const handleLocationSelect = useCallback((location: LocationData) => {
    setSelectedLocation(location);
    setMapView({ center: [location.lat, location.lng], zoom: FOCUSED_MAP_VIEW_ZOOM });
    if (!isSidebarOpen) setIsSidebarOpen(true);
  }, [isSidebarOpen]);

  const handleReturnToOverview = useCallback(() => {
    setSelectedLocation(OVERVIEW_LOCATION);
    setMapView(OVERVIEW_MAP_VIEW);
  }, []);

  const handleYearChange = useCallback((newYear: string) => {
    setSelectedYear(newYear);
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/emissions/campus`);
        if (!response.ok) throw new Error("Failed to fetch years");
        const data: CampusEmissionsResponse = await response.json();
        const years = new Set<string>();
        Object.values(data.emissions || {}).forEach(d => 
            Object.keys(d).forEach(y => !isNaN(parseInt(y)) && years.add(y))
        );
        setAvailableYears(["All", ...Array.from(years).sort((a, b) => parseInt(b) - parseInt(a))]);
      } catch (e) {
        console.error("Error fetching available years:", e);
      }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    const fetchDataForCampus = async () => {
      const campusId = selectedLocation.id as string;
      if (!campusId) return;

      setIsLoadingData(true);
      setDataError(null);
      setBuildingsData([]);
      
      const previousYear = selectedYear !== 'All' ? String(Number(selectedYear) - 1) : 'All';

      try {
        if (campusId === 'All') {
          setBuildingsData([]);
          setCampusTotalEmission(null);
          setCampusTotalEmissionPrevYear(null);
          setIsLoadingData(false);
          return;
        }

        const [buildingRes, campusCurrentRes, campusPrevRes] = await Promise.all([
          fetch(`${API_BASE_URL}/emissions/building?campus=${campusId}&year=${selectedYear}`),
          fetch(`${API_BASE_URL}/emissions/campus?campus=${campusId}&year=${selectedYear}&aggregate=total`),
          fetch(`${API_BASE_URL}/emissions/campus?campus=${campusId}&year=${previousYear}&aggregate=total`)
        ]);

        if (!buildingRes.ok || !campusCurrentRes.ok || !campusPrevRes.ok) {
          throw new Error("Network response was not ok");
        }

        const buildingData = await buildingRes.json();
        const campusCurrentData = await campusCurrentRes.json();
        const campusPrevData = await campusPrevRes.json();
        
        setCampusTotalEmission(campusCurrentData.total_emissions?.[campusId] || 0);
        setCampusTotalEmissionPrevYear(campusPrevData.total_emissions?.[campusId] || 0);

        const buildings = buildingData.buildings;
        if (buildings && typeof buildings === 'object') {
          const formattedBuildings: BuildingData[] = Object.entries(buildings)
            .map(([name, details]: [string, any]) => ({
              name,
              total_emission: details.total_emission || 0,
              rooms: details.rooms,
            }))
            .sort((a, b) => b.total_emission - a.total_emission);
          setBuildingsData(formattedBuildings);
        } else {
          setBuildingsData([]);
        }
      } catch (e: any) {
        setDataError(e.message);
        setBuildingsData([]);
        setCampusTotalEmission(null);
        setCampusTotalEmissionPrevYear(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDataForCampus();

  }, [selectedLocation, selectedYear]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Map</title>
        <meta name="description" content="Interactive map and dashboard of ITB campus carbon emissions" />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>
      <Layout noPadding={true}>
        <div className="h-[calc(100vh-4rem)] w-full relative flex">
          <LocationSidebar 
            isOpen={isSidebarOpen} 
            onReturnToOverview={handleReturnToOverview} 
            location={selectedLocation} 
            buildings={buildingsData} 
            isLoading={isLoadingData} 
            error={dataError} 
            selectedYear={selectedYear} 
            availableYears={availableYears} 
            onYearChange={handleYearChange} 
            campusTotalEmission={campusTotalEmission} 
            campusTotalEmissionPrevYear={campusTotalEmissionPrevYear} 
          />
          <div className="h-full flex-1">
            <MapComponent 
              onLocationSelect={handleLocationSelect} 
              allLocations={ALL_CAMPUS_LOCATIONS} 
              center={mapView.center} 
              zoom={mapView.zoom} 
              isSidebarOpen={isSidebarOpen} 
              onPopupClose={handleReturnToOverview} 
              selectedLocationId={selectedLocation.id} 
            />
          </div>
        </div>
      </Layout>
    </>
  );
}