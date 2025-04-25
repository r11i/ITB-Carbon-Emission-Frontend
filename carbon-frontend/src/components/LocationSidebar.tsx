// src/components/LocationSidebar.tsx

import React from "react";
import { LocationData } from "./MapComponent";

export interface BuildingData { name: string; total_emission: number; unit?: string; }

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
  imagePlaceholderUrl?: string;
}

const LocationSidebar: React.FC<LocationSidebarProps> = ({
  isOpen, onClose, location, buildings = [], isLoading, error,
  selectedYear, availableYears = ["All"], onYearChange, campusTotalEmission,
  activeTab, onTabChange, imagePlaceholderUrl = "/images/itb-placeholder.jpg",
}) => {

  if (!location) { return null; }

  const sortedBuildings = React.useMemo(() => {
    if (!isLoading && !error && buildings.length > 0) {
      return [...buildings].sort((a, b) => b.total_emission - a.total_emission);
    }
    return [];
  }, [buildings, isLoading, error]);

  const formatNumber = (num: number | undefined | null, decimals = 1): string => {
    if (num === undefined || num === null || isNaN(num)) return "N/A";
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  if (!location) return null;

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-30 z-10 transition-opacity duration-300 ease-in-out md:hidden ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={onClose} aria-hidden="true"></div>
      <div className={`fixed top-0 left-0 h-full w-[90vw] max-w-md bg-white shadow-xl z-20 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`} role="dialog" aria-modal="true" aria-labelledby="sidebar-title">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <h2 id="sidebar-title" className="text-lg sm:text-xl font-semibold text-gray-800 truncate pr-2" title={location.name}>{location.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-1 -mr-1" aria-label="Close location details">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-4 flex-shrink-0 border-b border-gray-100">
            <img src={imagePlaceholderUrl} onError={(e) => (e.currentTarget.src = '/images/itb-placeholder.jpg')} alt={`${location.name} campus`} className="w-full h-32 object-cover rounded-lg mb-4 bg-gray-200 border border-gray-200"/>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-lg p-3 mb-4">
                 <p className="text-xs text-blue-800/80 font-medium uppercase tracking-wider mb-1">Total Campus Emissions ({selectedYear === "All" ? "All Years" : selectedYear})</p>
                 {isLoading ? (<div className="h-7 w-3/4 bg-gray-300 rounded animate-pulse"></div>
                 ) : error && campusTotalEmission === null ? (<p className="text-2xl font-bold text-red-600">-</p>
                 ) : (<p className="text-2xl font-bold text-blue-900">{formatNumber(campusTotalEmission)}<span className="text-sm font-medium text-blue-700/90 ml-1">kg CO₂e</span></p>)}
            </div>
            <div>
                <label htmlFor="year-filter" className="block text-xs font-medium text-gray-500 mb-1">Select Year:</label>
                <select id="year-filter" value={selectedYear} onChange={(e) => onYearChange(e.target.value)} disabled={isLoading || availableYears.length <= 1} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500">
                    {availableYears.map(year => (<option key={year} value={year}>{year === "All" ? "All Years" : year}</option>))}
                </select>
            </div>
        </div>
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="-mb-px flex space-x-6 px-4" aria-label="Tabs">
            <button onClick={() => onTabChange("Summary")} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${activeTab === "Summary" ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} aria-current={activeTab === 'Summary' ? 'page' : undefined}>Summary</button>
            <button onClick={() => onTabChange("Buildings")} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ease-in-out ${activeTab === "Buildings" ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} aria-current={activeTab === 'Buildings' ? 'page' : undefined}>
              Buildings
              {!isLoading && buildings.length > 0 && (<span className="ml-1.5 inline-block py-0.5 px-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{buildings.length}</span>)}
            </button>
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "Summary" && (
             <div className="text-sm text-gray-700 space-y-4 pt-2">
                 <div><h3 className="text-base font-semibold text-gray-800 mb-1">Location Details</h3><p><strong className="font-medium text-gray-600">Address:</strong> {location.address}</p></div>
                 <div><h3 className="text-base font-semibold text-gray-800 mb-1">Emission Overview ({selectedYear === "All" ? "All Years" : selectedYear})</h3>
                      {isLoading && <p className="text-gray-500 italic">Loading emission details...</p>}
                      {!isLoading && error && <p className="text-red-600">Could not load emission details: {error}</p>}
                      {!isLoading && !error && (<>
                          {campusTotalEmission !== null ? (<p><strong className="font-medium text-gray-600">Total Emissions:</strong> {formatNumber(campusTotalEmission)} kg CO₂e</p>) : (<p className="text-gray-500 italic">No emission data available for the selected period.</p>)}
                           <p><strong className="font-medium text-gray-600">Buildings Tracked:</strong> {buildings.length > 0 ? buildings.length : '0'}</p></>)}
                 </div>
             </div>
          )}
          {activeTab === "Buildings" && (
            <div className="pt-2">
              {isLoading && (<div className="flex flex-col items-center justify-center h-40 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div><p className="text-sm text-gray-500">Loading building data...</p></div>)}
              {error && !isLoading && (<div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-md relative text-sm" role="alert"><strong className="font-bold block mb-1">Error Loading Buildings!</strong><span className="block sm:inline">{error}</span></div>)}
              {!isLoading && !error && sortedBuildings.length > 0 && (
                <ul className="space-y-3">
                  {sortedBuildings.map((building, index) => (
                    <li key={building.name} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200/80 transition duration-150 ease-in-out shadow-sm">
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center flex-1 min-w-0">
                           <span className="text-xs inline-block bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center mr-2.5 font-semibold flex-shrink-0">{index + 1}</span>
                           <span className="font-medium text-gray-800 text-sm sm:text-base truncate block" title={building.name}>{building.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-blue-700 whitespace-nowrap flex-shrink-0">{formatNumber(building.total_emission)}<span className="text-xs text-gray-500 ml-1">{building.unit || 'kg CO₂e'}</span></span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!isLoading && !error && sortedBuildings.length === 0 && (<p className="text-gray-500 text-center py-10 text-sm italic">No building emission data found for this campus{selectedYear !== "All" ? ` in ${selectedYear}` : ''}.</p>)}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LocationSidebar;