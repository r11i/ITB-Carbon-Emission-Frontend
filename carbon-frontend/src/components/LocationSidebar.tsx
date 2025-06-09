import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

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

const LocationSidebar: React.FC<LocationSidebarProps> = ({
  isOpen, onClose, location, buildings = [], isLoading, error,
  selectedYear, availableYears = ["All"], onYearChange, campusTotalEmission,
  activeTab, onTabChange,
}) => {
  if (!location) return null;

  const getImageUrlFromLocation = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("ganesha")) return "/itb-gane.jpg";
    if (normalized.includes("jat")) return "/itb-nangor.jpg";
    if (normalized.includes("cirebon")) return "/itb-cirebon.jpg";
    if (normalized.includes("jakarta")) return "/itb-jakarta.jpg";
    return "/images/itb-placeholder.jpg";
  };

  const imagePlaceholderUrl = getImageUrlFromLocation(location.name);

  const sortedBuildings = React.useMemo(() => {
    if (!isLoading && !error && buildings.length > 0) {
      return [...buildings].sort((a, b) => b.total_emission - a.total_emission);
    }
    return [];
  }, [buildings, isLoading, error]);

  const formatNumber = (num: number | undefined | null, decimals = 1): string => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
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
        className={`fixed top-0 left-0 h-full w-[90vw] max-w-md bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out flex flex-col ${
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
                {selectedYear === "All" ? "All time data" : `Year ${selectedYear}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Gambar kampus */}
        <div className="relative w-full aspect-video overflow-hidden">
          <img
            src={imagePlaceholderUrl}
            onError={(e) => (e.currentTarget.src = '/images/itb-placeholder.jpg')}
            alt={`${location.name} campus`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <p className="text-sm text-white">{location.address}</p>
          </div>
        </div>

        {/* Konten utama */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Total Emissions</p>
              {isLoading ? (
                <div className="h-8 mt-1 bg-gray-200 rounded animate-pulse" />
              ) : error ? (
                <p className="text-red-500 text-sm mt-1">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatNumber(campusTotalEmission)} <span className="text-sm text-gray-500">kg CO₂e</span>
                </p>
              )}
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Buildings Tracked</p>
              {isLoading ? (
                <div className="h-8 mt-1 bg-gray-200 rounded animate-pulse" />
              ) : error ? (
                <p className="text-red-500 text-sm mt-1">Error</p>
              ) : (
                <p className="text-2xl font-bold text-gray-900 mt-1">{buildings.length}</p>
              )}
            </div>
          </div>

          {/* Selector tahun */}
          <div className="px-4 mb-4">
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              disabled={isLoading || availableYears.length <= 1}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year === "All" ? "All Years" : year}
                </option>
              ))}
            </select>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-4">
            <nav className="flex space-x-8">
              {["Summary", "Buildings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab as "Summary" | "Buildings")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                  {tab === "Buildings" && buildings.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-gray-100 rounded-full">
                      {buildings.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Isi tab */}
          <div className="p-4">
            {activeTab === "Summary" ? (
              <>
                <h3 className="text-lg font-semibold text-gray-900">About This Campus</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Detailed carbon emissions data for {location.name}. The campus has {buildings.length} buildings with tracked energy consumption contributing to the total carbon footprint.
                </p>
                <h3 className="text-lg font-semibold text-gray-900 mt-6">Emission Trends</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {campusTotalEmission !== null
                    ? `Total emissions for ${selectedYear === "All" ? "all time" : selectedYear}: ${formatNumber(
                        campusTotalEmission
                      )} kg CO₂e`
                    : "No emission data available for this period."}
                </p>
                {/* Line Chart */}
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={[
                        { year: "2022", emissions: 27679.633 },
                        { year: "2023", emissions: 26646.333 },
                        { year: "2024", emissions: 25886.466 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="emissions" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : sortedBuildings.length > 0 ? (
              <div className="space-y-3">
                {sortedBuildings.map((b, i) => (
                  <div key={b.name} className="flex justify-between items-center p-3 border rounded-lg bg-white hover:shadow-sm">
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-medium mr-3">
                        {i + 1}
                      </div>
                      <span className="font-medium text-gray-900">{b.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-900 font-semibold">{formatNumber(b.total_emission)}</div>
                      <div className="text-xs text-gray-500">{b.unit || "kg CO₂e"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">No building emission data found.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationSidebar;