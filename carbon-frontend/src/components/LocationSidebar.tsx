// src/components/LocationSidebar.tsx

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router"; 
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { LocationData } from "./MapComponent";

// --- Tipe Data ---
interface RoomData {
  name: string;
  emission: number;
}
export interface BuildingData {
  name: string;
  total_emission: number;
  unit?: string;
  rooms?: RoomData[];
}
interface LocationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationData | null;
  buildings: BuildingData[];
  isLoading: boolean;
  error: string | null;
  selectedYear: string;
  availableYears: string[];
  onYearChange: (newYear: string) => void;
  campusTotalEmission: number | null;
  activeTab: "Summary" | "Buildings";
  onTabChange: (newTab: "Summary" | "Buildings") => void;
}

// --- Konstanta & Komponen Helper ---
const ganeshaCampusInfo = {
  apiNameKey: "Ganesha",
  image: "/itb-gane.jpg",
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ChartSkeleton: React.FC = () => (
  <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse p-4 space-y-4">
    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    <div className="h-40 bg-gray-300 rounded"></div>
    <div className="flex justify-between">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
);

const formatNumber = (num: number | undefined | null, decimals = 1): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const RoomList: React.FC<{ rooms: RoomData[] }> = ({ rooms }) => {
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => b.emission - a.emission);
  }, [rooms]);

  return (
    <div className="mt-2 ml-8 pl-4 py-2 border-l-2 border-blue-200 bg-gray-50/50 rounded-r-md">
      <h4 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">Room Details</h4>
      <ul className="space-y-1">
        {sortedRooms.map((room, index) => (
          <li key={`${room.name}-${index}`} className="flex justify-between items-center text-sm py-1">
            <span className="text-gray-700 w-3/4 pr-2">{room.name}</span>
            <span className="font-semibold text-gray-800 text-right">{formatNumber(room.emission)} kg CO₂e</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


const LocationSidebar: React.FC<LocationSidebarProps> = ({
  isOpen, onClose, location, buildings = [], isLoading: isLoadingParent, error: errorParent, selectedYear, availableYears = ["All"], onYearChange, campusTotalEmission, activeTab, onTabChange,
}) => {
  const router = useRouter(); 
  const [trendChartData, setTrendChartData] = useState<Array<{ year: string; emissions: number }>>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [errorChart, setErrorChart] = useState<string | null>(null);
  const [expandedBuildingName, setExpandedBuildingName] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && location && location.name.toLowerCase().includes("ganesha")) {
      const fetchEmissionTrendData = async () => {
        setIsLoadingChart(true);
        setErrorChart(null);
        try {
          const apiUrl = `/api/emissions/campus?campus=${ganeshaCampusInfo.apiNameKey}&year=All`;
          const response = await fetch(apiUrl);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();
          const campusEmissions = data.emissions?.[ganeshaCampusInfo.apiNameKey];

          if (campusEmissions && typeof campusEmissions === 'object') {
            const formattedData = Object.keys(campusEmissions)
              .map(year => ({ year: year, emissions: campusEmissions[year] as number }))
              .filter(d => !isNaN(parseInt(d.year)))
              .sort((a, b) => parseInt(a.year) - parseInt(b.year));
            setTrendChartData(formattedData);
          } else {
            setTrendChartData([]);
          }
        } catch (e: any) {
          setErrorChart(e.message || "Failed to load trend data.");
          setTrendChartData([]);
        } finally {
          setIsLoadingChart(false);
        }
      };
      fetchEmissionTrendData();
    } else if (!isOpen || !location) {
        setTrendChartData([]);
        setIsLoadingChart(false);
        setErrorChart(null);
    }
  }, [isOpen, location]);
  
  useEffect(() => {
    setExpandedBuildingName(null);
  }, [activeTab, selectedYear]);

  if (!location) return null;

  const imagePlaceholderUrl = ganeshaCampusInfo.image;

  const sortedBuildings = useMemo(() => {
    if (!isLoadingParent && !errorParent && buildings.length > 0) {
      return [...buildings].sort((a, b) => b.total_emission - a.total_emission);
    }
    return [];
  }, [buildings, isLoadingParent, errorParent]);

  const handleBuildingClick = (buildingName: string) => {
    setExpandedBuildingName(prev => (prev === buildingName ? null : buildingName));
  };
  
  const handleNavigateToDashboard = () => {
    onClose(); 
    setTimeout(() => {
      router.push('/carbon-dashboard');
    }, 300);
  };

  return (
    <>
      {/* Backdrop (di bawah sidebar dan navbar) */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Sidebar (di bawah navbar) */}
      <div
        className={`fixed top-16 left-0 h-[calc(100%-4rem)] w-[90vw] max-w-lg bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/*
          --- PERUBAHAN DI SINI ---
          Header sekarang menggunakan bg-blue-100 dengan border bawah
          dan warna teks yang disesuaikan agar serasi.
        */}
        <div className="p-4 bg-blue-100 border-b border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-blue-900">{location.name}</h2>
              <p className="text-xs text-blue-700/80 mt-1">
                {selectedYear === "All" ? "All time data" : `Data for ${selectedYear}`}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-blue-600 hover:bg-blue-200/70 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Gambar Kampus */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img src={imagePlaceholderUrl} onError={(e) => (e.currentTarget.src = '/images/itb-placeholder.jpg')} alt={`${location.name} campus`} className="w-full h-full object-cover"/>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4"><p className="text-sm text-white">{location.address}</p></div>
        </div>

        {/* Konten Utama (Scrollable) */}
        <div className="flex-1 overflow-y-auto pb-20">
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Emissions</p>
              {isLoadingParent ? <div className="h-8 mt-1 bg-gray-200 rounded animate-pulse" /> : errorParent ? <p className="text-red-500 text-sm mt-1">Error</p> : (
                <p className="text-2xl font-bold text-gray-900 mt-1 whitespace-nowrap">
                  {formatNumber(campusTotalEmission)} <span className="text-sm text-gray-500">kg CO₂e</span>
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Buildings Tracked</p>
              {isLoadingParent ? <div className="h-8 mt-1 bg-gray-200 rounded animate-pulse" /> : errorParent ? <p className="text-red-500 text-sm mt-1">Error</p> : (
                <p className="text-2xl font-bold text-gray-900 mt-1">{buildings.length}</p>
              )}
            </div>
          </div>
          <div className="px-4 mb-4">
            <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)} disabled={isLoadingParent || availableYears.length <= 1} className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              {availableYears.map((year) => (<option key={year} value={year}>{year === "All" ? "All Years" : year}</option>))}
            </select>
          </div>
          <div className="border-b border-gray-200 px-4">
            <nav className="flex space-x-8">
              {(["Summary", "Buildings"] as const).map((tab) => (
                <button key={tab} onClick={() => onTabChange(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${ activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  {tab}
                  {tab === "Buildings" && buildings.length > 0 && (<span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{buildings.length}</span>)}
                </button>
              ))}
            </nav>
          </div>
          <div className="p-4">
            {activeTab === "Summary" ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">About This Campus</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Detailed carbon emissions data for {location.name}.
                  {buildings.length > 0 ? ` The campus has ${buildings.length} buildings with tracked energy consumption contributing to the total carbon footprint.` : " Emission data by building is not yet available for the selected period."}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-6">Emission Trends</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Annual emission trends for {location.name}.
                </p>
                <div className="mt-6">
                  {isLoadingChart ? ( <ChartSkeleton />
                  ) : errorChart ? ( <p className="text-center text-red-500 py-4">Error loading trends: {errorChart}</p>
                  ) : trendChartData.length === 0 ? ( <p className="text-center text-gray-500 py-4">No annual emission trend data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="year" stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value, 0)} />
                        <Tooltip
                          formatter={(value: number) => [`${formatNumber(value,0)} kg CO₂e`, "Emissions"]}
                          labelStyle={{ fontWeight: 'bold', color: '#374151' }} itemStyle={{ color: '#1e40af' }}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid #e5e7eb', borderRadius: '0.375rem', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' }}
                          cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        />
                        <Line type="monotone" dataKey="emissions" name="Emissions" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb", strokeWidth: 1, stroke: "#fff" }} activeDot={{ r: 6, stroke: "#1d4ed8", strokeWidth: 2, fill: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </>
            ) : ( 
              sortedBuildings.length > 0 ? (
              <div className="space-y-2">
                {sortedBuildings.map((b, i) => (
                  <div key={`${b.name}-${i}`} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => handleBuildingClick(b.name)}
                      className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-50 transition-colors duration-150 ease-in-out"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full ${i < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'} font-medium mr-3`}>{i + 1}</div>
                        <span className="font-medium text-gray-900">{b.name}</span>
                      </div>
                      <div className="text-right ml-2 flex-shrink-0">
                        <div className="text-gray-900 font-semibold">{formatNumber(b.total_emission)}</div>
                        <div className="text-xs text-gray-500">{b.unit || "kg CO₂e"}</div>
                      </div>
                    </button>
                    {expandedBuildingName === b.name && (
                      b.rooms && b.rooms.length > 0 ? (
                        <RoomList rooms={b.rooms} />
                      ) : (
                        <p className="px-4 pb-3 pt-1 ml-10 text-xs text-gray-500">No detailed room data available.</p>
                      )
                    )}
                  </div>
                ))}
              </div>
              ) : isLoadingParent ? ( <p className="text-sm text-gray-500 text-center py-4">Loading building data...</p>
              ) : ( <p className="text-sm text-gray-500 text-center py-4">No building emission data found for {selectedYear === "All" ? "this campus" : `the year ${selectedYear}`}.</p>)
            )}
          </div>
        </div>

        {/* Tombol Navigasi Bawah */}
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            <button
                onClick={handleNavigateToDashboard}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
                View Full Dashboard
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
      </div>
    </>
  );
};

export default LocationSidebar;