// src/components/LocationSidebar.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type { LocationData } from "./MapComponent"; // Pastikan path benar

export interface BuildingData {
  name: string;
  total_emission: number;
  unit?: string;
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

const ganeshaCampusInfo = {
  apiNameKey: "Ganesha",
  image: "/itb-gane.jpg", // Pastikan ada di /public/itb-gane.jpg
};
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// Komponen Skeleton untuk Chart
const ChartSkeleton: React.FC = () => (
  <div className="w-full h-[300px] bg-gray-200 rounded-lg animate-pulse p-4 space-y-4">
    <div className="h-6 bg-gray-300 rounded w-3/4"></div>
    <div className="h-4 bg-gray-300 rounded w-full"></div>
    <div className="h-4 bg-gray-300 rounded w-5/6"></div>
    <div className="h-40 bg-gray-300 rounded"></div> {/* Placeholder untuk area chart utama */}
    <div className="flex justify-between">
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/4"></div>
    </div>
  </div>
);


const LocationSidebar: React.FC<LocationSidebarProps> = ({
  isOpen,
  onClose,
  location,
  buildings = [],
  isLoading: isLoadingParent,
  error: errorParent,
  selectedYear,
  availableYears = ["All"],
  onYearChange,
  campusTotalEmission,
  activeTab,
  onTabChange,
}) => {
  const [trendChartData, setTrendChartData] = useState<Array<{ year: string; emissions: number }>>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [errorChart, setErrorChart] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && location && location.name.toLowerCase().includes("ganesha")) {
      const fetchEmissionTrendData = async () => {
        console.log("[LocationSidebar] Fetching emission trend data for Ganesha...");
        setIsLoadingChart(true);
        setErrorChart(null);
        try {
          // Sesuaikan endpoint jika perlu, misalnya untuk tahun tertentu jika selectedYear !== "All"
          const apiUrl = `${API_BASE_URL}/emissions/campus?campus=${ganeshaCampusInfo.apiNameKey}&year=All`; // Ambil semua tahun untuk Ganesha
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          const campusEmissions = data.emissions?.[ganeshaCampusInfo.apiNameKey];

          if (campusEmissions && typeof campusEmissions === 'object') {
            const formattedData = Object.keys(campusEmissions)
              .map(year => ({
                year: year,
                emissions: campusEmissions[year] as number,
              }))
              .filter(d => !isNaN(parseInt(d.year)))
              .sort((a, b) => parseInt(a.year) - parseInt(b.year));
            setTrendChartData(formattedData);
            console.log("[LocationSidebar] Trend data fetched:", formattedData.length, "points");
          } else {
            console.warn(`[LocationSidebar] Trend data for ${ganeshaCampusInfo.apiNameKey} not found or invalid format.`);
            setTrendChartData([]);
          }
        } catch (e: any) {
          console.error("[LocationSidebar] Failed to fetch trend data:", e);
          setErrorChart(e.message || "Failed to load trend data.");
          setTrendChartData([]);
        } finally {
          setIsLoadingChart(false);
        }
      };
      fetchEmissionTrendData();
    } else if (!isOpen || !location) {
        setTrendChartData([]);
        setIsLoadingChart(false); // Pastikan reset loading jika ditutup
        setErrorChart(null);
    }
  }, [isOpen, location]);

  if (!location) return null;

  const imagePlaceholderUrl = ganeshaCampusInfo.image;

  const sortedBuildings = useMemo(() => {
    if (!isLoadingParent && !errorParent && buildings.length > 0) {
      return [...buildings].sort((a, b) => b.total_emission - a.total_emission);
    }
    return [];
  }, [buildings, isLoadingParent, errorParent]);

  const formatNumber = (num: number | undefined | null, decimals = 1): string => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const getEmissionLevelColor = (value: number | null) => {
    if (value === null) return "from-gray-400 to-gray-300";
    if (value < 1000) return "from-green-500 to-green-400";
    if (value < 5000) return "from-yellow-500 to-yellow-400";
    if (value < 10000) return "from-orange-500 to-orange-400";
    return "from-red-500 to-red-400";
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-10 transition-opacity duration-300 ease-in-out md:hidden ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed top-0 left-0 h-full w-[90vw] max-w-lg bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="relative p-4">
          <div className={`absolute inset-0 bg-gradient-to-r ${getEmissionLevelColor(campusTotalEmission)} opacity-20`} />
          <div className="relative flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{location.name}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {selectedYear === "All" ? "All time data" : `Data for ${selectedYear}`}
              </p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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
        <div className="flex-1 overflow-y-auto">
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
                  {/* --- MODIFIKASI LOADING STATE UNTUK CHART --- */}
                  {isLoadingChart ? (
                    <ChartSkeleton />
                  ) : errorChart ? (
                    <p className="text-center text-red-500 py-4">Error loading trends: {errorChart}</p>
                  ) : trendChartData.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No annual emission trend data available.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                        <XAxis dataKey="year" stroke="#6b7280" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} tickFormatter={(value) => formatNumber(value, 0)} />
                        <Tooltip
                          formatter={(value: number) => [`${formatNumber(value,0)} kg CO₂e`, "Emissions"]} // Dibuat konsisten dengan YAxis
                          labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                          itemStyle={{ color: '#1e40af' }}
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                          }}
                          cursor={{ stroke: '#d1d5db', strokeWidth: 1 }}
                        />
                        <Line type="monotone" dataKey="emissions" name="Emissions" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb", strokeWidth: 1, stroke: "#fff" }} activeDot={{ r: 6, stroke: "#1d4ed8", strokeWidth: 2, fill: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                  {/* --- AKHIR MODIFIKASI --- */}
                </div>
              </>
            ) : ( /* Tab Gedung */
                sortedBuildings.length > 0 ? (
              <div className="space-y-3">
                {sortedBuildings.map((b, i) => (
                  <div key={`${b.name}-${i}`} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow duration-150 ease-in-out">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${i < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'} font-medium mr-3`}>{i + 1}</div>
                      <span className="font-medium text-gray-900">{b.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-semibold">{formatNumber(b.total_emission)}</div>
                      <div className="text-xs text-gray-500">{b.unit || "kg CO₂e"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : isLoadingParent ? ( <p className="text-sm text-gray-500 text-center py-4">Loading building data...</p>
            ) : ( <p className="text-sm text-gray-500 text-center py-4">No building emission data found for {selectedYear === "All" ? "this campus" : `the year ${selectedYear}`}.</p>)
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSidebar;