import React, { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/router";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps
} from "recharts";
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const trendPalette = ["#3B82F6"];
const comparisonPalette = ["#1E3A8A", "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD"];
const campusPiePalette = ["#10B981", "#34D399", "#6EE7B7", "#A7F3D0", "#047857"];
const buildingPiePalette = ["#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#4338CA"];
const roomPiePalette = ["#F59E0B", "#FBBF24", "#FCD34D", "#FEF3C7", "#B45309"];
const devicePiePalette = ["#A4B465", "#FFCF50", "#D4A373", "#B7C9A8", "#E9EDC9"];
const grayPalette = ["#F9FAFB", "#F3F4F6", "#E5E7EB", "#D1D5DB", "#9CA3AF", "#6B7280", "#4B5563", "#374151", "#1F2937", "#11182C"];

const monthLabels: { [key: number]: string } = {
  1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun",
  7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"
};

// --- Interfaces ---
interface DataPoint { year?: string; month?: string; [key: string]: string | number | undefined; }
interface CampusData { [campus: string]: { [yearOrMonth: string]: number; }; }
interface PieSliceData { name: string; value: number; }
interface RoomData { [roomName: string]: number; }
interface BuildingData { total_emission: number; rooms: RoomData; }
interface BuildingJson { [buildingName: string]: BuildingData; }

// --- Helper Functions ---
const formatNumber = (num: number | undefined | null, decimals = 0): string => {
    if (num === undefined || num === null) return "N/A";
    return num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

const formatTooltipValue = (value: number): string => {
    return `${formatNumber(value, 1)} kg CO₂e`;
};

// --- Reusable Components ---
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return (
        <div className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto`}></div>
    );
};

interface DashboardCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon: ReactNode;
    isLoading?: boolean;
}
const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, unit, icon, isLoading }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow duration-200 min-h-[90px]">
        <div className="flex items-center space-x-3 h-full">
            <div className="p-2.5 rounded-full bg-blue-100 text-blue-600">
                {icon}
            </div>
            <div className="flex-1 overflow-hidden">
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{title}</div>
                {isLoading ? (
                    <div className="h-6 mt-1 w-2/3 bg-gray-200 rounded animate-pulse"></div>
                ) : (
                    <div className="text-xl font-bold text-slate-800 truncate" title={typeof value === 'string' ? value : undefined}>
                        {typeof value === 'number' ? formatNumber(value) : value}
                        {unit && <span className="text-sm font-medium text-slate-500 ml-1">{unit}</span>}
                    </div>
                )}
            </div>
        </div>
    </div>
);

interface ChartContainerProps {
    title: string;
    children: ReactNode;
    isLoading?: boolean;
    actions?: ReactNode;
    className?: string;
}
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, isLoading, actions, className = "" }) => (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-slate-200/60 relative ${className}`}>
        {isLoading && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10 rounded-xl">
                <LoadingSpinner size="sm" />
            </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-base lg:text-lg font-semibold text-slate-800 flex-1 truncate">{title}</h2>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
        <div className="h-72 md:h-80 w-full">
            {children}
        </div>
    </div>
);


// --- Main Dashboard Component ---
const Dashboard = () => {
  const router = useRouter();

  // --- State ---
  const [comparisonData, setComparisonData] = useState<DataPoint[]>([]);
  const [campusRawData, setCampusRawData] = useState<CampusData>({});
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"year" | "month">("year");
  const [campusPieData, setCampusPieData] = useState<PieSliceData[]>([]);
  const [devicePieData, setDevicePieData] = useState<PieSliceData[]>([]);
  const [totalEmissions, setTotalEmissions] = useState<number | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(true);
  const [isLoadingMonthly, setIsLoadingMonthly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [buildingPieData, setBuildingPieData] = useState<PieSliceData[]>([]);
  const [roomPieData, setRoomPieData] = useState<PieSliceData[]>([]);
  const [currentCampus, setCurrentCampus] = useState<string | null>(null);
  const [currentBuilding, setCurrentBuilding] = useState<string | null>(null);
  const [buildingJsonData, setBuildingJsonData] = useState<BuildingJson | null>(null);
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState<boolean>(false);

  // --- Generic Fetch Utility ---
  const fetchApi = useCallback(async <T,>(endpoint: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${endpoint}`);
    if (!res.ok) {
        const errorText = await res.text();
        console.error(`API Error (${res.status}) on ${endpoint}: ${errorText}`);
        throw new Error(`Failed to fetch data from ${endpoint}. Status: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }, []); // Dependency array is empty as API_BASE_URL is constant within component scope

  // --- Data Fetching Callbacks ---
  const fetchYearlyData = useCallback(async (isInitialLoad = false) => {
    if (!isInitialLoad) setIsLoadingMonthly(true);
    try {
        const json = await fetchApi<{ emissions: CampusData }>("/emissions/campus");
        const emissions = json.emissions;
        const structured: DataPoint[] = [];
        let total = 0;
        Object.entries(emissions).forEach(([campus, yearData]) => {
            Object.entries(yearData).forEach(([year, emission]) => {
                let existing = structured.find((d) => d.year === year);
                if (!existing) { existing = { year }; structured.push(existing); }
                existing[campus] = emission;
                total += emission;
            });
        });
        structured.sort((a, b) => parseInt(a.year!) - parseInt(b.year!));
        setCampusRawData(emissions);
        setComparisonData(structured);
        setTotalEmissions(total);
        setChartMode("year");
        setSelectedYear(null);
        setError(null);
        if (!isInitialLoad) {
            setBuildingPieData([]); setRoomPieData([]); setCurrentCampus(null);
            setCurrentBuilding(null); setBuildingJsonData(null);
        }
    } catch (err: any) {
        console.error("Failed to fetch yearly data", err);
        setError(err.message || "Failed to load yearly emissions data.");
        setTotalEmissions(null);
    } finally {
        if (!isInitialLoad) setIsLoadingMonthly(false);
    }
  }, [fetchApi]);

  const fetchMonthlyData = useCallback(async (year: string) => {
    setIsLoadingMonthly(true);
    setError(null);
    try {
        const json = await fetchApi<{ emissions: CampusData }>(`/emissions/campus?year=${year}`);
        const emissions = json.emissions;
        const structured: DataPoint[] = [];
        Object.entries(emissions).forEach(([campus, monthData]) => {
            Object.entries(monthData).forEach(([month, emission]) => {
                let existing = structured.find((d) => d.month === month);
                if (!existing) { existing = { month }; structured.push(existing); }
                existing[campus] = emission;
            });
        });
        structured.sort((a, b) => parseInt(a.month!) - parseInt(b.month!));
        setComparisonData(structured);
        setSelectedYear(year);
        setChartMode("month");
    } catch (err: any) {
        console.error("Failed to fetch monthly data for year:", year, err);
        setError(err.message || `Failed to load monthly data for ${year}.`);
    } finally {
        setIsLoadingMonthly(false);
    }
  }, [fetchApi]);

  const fetchCampusPieData = useCallback(async () => {
    setError(null);
    try {
        const json = await fetchApi<{ emissions: CampusData }>("/emissions/campus");
        const emissions = json.emissions;
        const structured: PieSliceData[] = Object.entries(emissions)
            .map(([campus, yearlyData]) => ({
                name: campus,
                value: Object.values(yearlyData).reduce((acc, val) => acc + val, 0)
            }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
        setCampusPieData(structured);
        setBuildingPieData([]); setRoomPieData([]); setCurrentCampus(null);
        setCurrentBuilding(null); setBuildingJsonData(null);
    } catch (err: any) {
        console.error("Failed to fetch campus pie data", err);
        setError(err.message || "Failed to load campus breakdown data.");
        setCampusPieData([]);
    }
  }, [fetchApi]);

  const fetchDeviceData = useCallback(async () => {
    setError(null);
    try {
        const json = await fetchApi<{ device_emissions?: { [key: string]: number } }>("/emissions/device");
        if (!json.device_emissions) { setDevicePieData([]); return; }
        const structured: PieSliceData[] = Object.entries(json.device_emissions)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0).sort((a, b) => b.value - a.value);
        setDevicePieData(structured);
    } catch (err: any) {
        console.error("Failed to fetch device data", err);
        setError(err.message || "Failed to load device emissions data.");
        setDevicePieData([]);
    }
  }, [fetchApi]);

  const fetchBuildingPieData = useCallback(async (campusName: string) => {
    if (!campusName) return;
    setIsLoadingBreakdown(true);
    setError(null);
    try {
        const json = await fetchApi<{ buildings: BuildingJson }>(
            `/emissions/building?campus=${encodeURIComponent(campusName)}`
        );
        const buildings = json.buildings;
        const structured: PieSliceData[] = Object.entries(buildings)
            .map(([name, data]) => ({ name, value: data.total_emission }))
            .filter(item => item.value > 0).sort((a, b) => b.value - a.value);
        setBuildingJsonData(buildings);
        setBuildingPieData(structured);
        setCurrentCampus(campusName);
        setRoomPieData([]); setCurrentBuilding(null);
    } catch (err: any) {
        console.error("Failed to fetch building data for campus:", campusName, err);
        setError(err.message || `Failed to load building data for ${campusName}.`);
    } finally {
        setIsLoadingBreakdown(false);
    }
  }, [fetchApi]);

  const fetchRoomPieData = useCallback((buildingName: string) => {
    if (!buildingJsonData || !buildingJsonData[buildingName]?.rooms) {
        console.warn("No room data found for building:", buildingName);
        setRoomPieData([]); return;
    }
    const rooms: RoomData = buildingJsonData[buildingName].rooms;
    const structured: PieSliceData[] = Object.entries(rooms)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0).sort((a, b) => b.value - a.value);
    setRoomPieData(structured);
    setCurrentBuilding(buildingName);
  }, [buildingJsonData]); // Depends only on buildingJsonData

  // --- Event Handlers ---
  const handlePieClick = useCallback((data: any) => {
    if (isLoadingBreakdown) return;
    const name = data?.name;
    if (!name) return;
    if (roomPieData.length === 0 && buildingPieData.length > 0) fetchRoomPieData(name);
    else if (roomPieData.length === 0 && buildingPieData.length === 0) fetchBuildingPieData(name);
  }, [isLoadingBreakdown, roomPieData.length, buildingPieData.length, fetchRoomPieData, fetchBuildingPieData]);

  const handleBackPie = useCallback(() => {
    if (roomPieData.length > 0) {
      setRoomPieData([]); setCurrentBuilding(null);
    } else if (buildingPieData.length > 0) {
      setBuildingPieData([]); setCurrentCampus(null); setBuildingJsonData(null);
    }
  }, [roomPieData.length, buildingPieData.length]); // Correct dependencies

  // --- Initial Data Load Effect ---
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingInitial(true);
      setError(null);
      try {
        await Promise.all([ fetchYearlyData(true), fetchCampusPieData(), fetchDeviceData() ]);
      } catch (err) {
        setError("Failed to load initial dashboard data. Please try refreshing.");
        console.error("Error during initial data load:", err);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Derived State & Variables ---
  const yearsForSelector = Array.from(new Set(comparisonData.map(d => d.year))).filter(y => y).sort();
  const averageMonthlyEmission = totalEmissions !== null ? totalEmissions / 12 : null;
  const topEmittingCampusName = campusPieData.length > 0 ? campusPieData[0].name : null;
  const breakdownTitle = roomPieData.length > 0 ? `Room Emissions in ${currentBuilding}`
                       : buildingPieData.length > 0 ? `Building Emissions for ${currentCampus}`
                       : "Total Emissions by Campus";
  const breakdownData = roomPieData.length > 0 ? roomPieData
                      : buildingPieData.length > 0 ? buildingPieData
                      : campusPieData;
  const breakdownPalette = roomPieData.length > 0 ? roomPiePalette
                         : buildingPieData.length > 0 ? buildingPiePalette
                         : campusPiePalette;
  const canGoBackInBreakdown = buildingPieData.length > 0 || roomPieData.length > 0;
  const backButtonLabel = roomPieData.length > 0 ? "to Buildings" : "to Campuses";
  const isBreakdownPieClickable = roomPieData.length === 0;

  // --- Loading Render ---
  if (isLoadingInitial) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-slate-600 font-medium">Loading Carbon Emissions Data...</p>
        </div>
      </div>
    );
  }

  // --- Error Render ---
   if (error && !isLoadingInitial && totalEmissions === null) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">Oops! Something went wrong.</h2>
                <p className="text-slate-500 mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors">Retry</button>
            </div>
        );
    }

  // --- Custom Chart Components ---
  // These functions are defined outside the main component body or memoized if needed
  const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.03) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold pointer-events-none">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
     if (active && payload && payload.length) {
      const data = payload[0].payload;
      let title = "";
      if (chartMode === 'year' && data?.year) title = `Year: ${data.year}`;
      else if (chartMode === 'month' && data?.month && selectedYear) title = `Month: ${monthLabels[parseInt(data.month)] || data.month}, ${selectedYear}`;
      else if (payload[0]?.name) title = `${payload[0].name}`;
      else if (label) title = `${label}`;
      return (
        <div className="bg-white/95 p-2.5 rounded-lg shadow-lg border border-gray-200/80 text-xs backdrop-blur-sm">
          <p className="font-semibold text-gray-700 mb-1.5 border-b border-gray-200 pb-1">{title}</p>
          {payload.map((entry, index) => (
             <div key={`item-${index}`} className="flex items-center justify-between space-x-2">
                <div className="flex items-center overflow-hidden">
                    <span className="w-2 h-2 rounded-full mr-1.5 flex-shrink-0" style={{ backgroundColor: entry.color || entry.payload?.fill }}></span>
                    <span className="text-gray-600 truncate" title={entry.name?.toString()}>{entry.name}:</span>
                </div>
                 <span className="font-medium text-gray-800 whitespace-nowrap">{formatTooltipValue(entry.value as number)}</span>
             </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // --- Main Render ---
  // This is line 306
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen font-sans">
      {/* Header Section */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Home
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            ITB Carbon Emissions Dashboard
          </h1>
          <div className="w-5"></div>
        </div>


         {/* Error Banner */}
         {error && totalEmissions !== null && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-sm rounded-md" role="alert">
                {error}
            </div>
         )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <DashboardCard
                title="Total Tracked Emissions"
                value={totalEmissions ?? '-'}
                unit={totalEmissions !== null ? "kg CO₂e" : undefined}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>}
                isLoading={totalEmissions === null && isLoadingInitial}
            />
            <DashboardCard
                title="Est. Average Monthly"
                value={averageMonthlyEmission ?? '-'}
                unit={averageMonthlyEmission !== null ? "kg CO₂e" : undefined}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                isLoading={totalEmissions === null && isLoadingInitial}
             />
             <DashboardCard
                title="Top Emitter (Campus)"
                value={topEmittingCampusName ?? '-'}
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 3.636a1 1 0 011.414 0L10 7.172l3.536-3.536a1 1 0 111.414 1.414L11.414 8.586l3.536 3.535a1 1 0 11-1.414 1.415L10 10.414l-3.536 3.536a1 1 0 01-1.414-1.415L8.586 8.586 5.05 5.051a1 1 0 010-1.415z" clipRule="evenodd" /></svg>}
                isLoading={campusPieData.length === 0 && isLoadingInitial}
            />
        </div>
      </header>

      {/* Main Content */}
      <main className="space-y-6">
            {/* Row 1: Trend Chart */}
            <ChartContainer
                title={chartMode === 'year' ? "Total Annual Emissions Trend" : `Monthly Emissions Trend for ${selectedYear}`}
                isLoading={isLoadingMonthly}
                actions={
                    <>
                        {chartMode === 'year' && yearsForSelector.map(year => (
                            <button key={year} onClick={() => fetchMonthlyData(year!)} disabled={isLoadingMonthly} className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${selectedYear === year ? 'bg-blue-600 text-white ring-2 ring-blue-300 ring-offset-1' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50'}`}>{year}</button>
                        ))}
                        {chartMode === 'month' && (
                            <button onClick={() => fetchYearlyData()} disabled={isLoadingMonthly} className="flex items-center text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                Show Annual Trend
                            </button>
                        )}
                    </>
                }
            >
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={comparisonData.map(d => ({ ...d, name: chartMode === 'year' ? d.year : (monthLabels[parseInt(d.month!)] || d.month), total: Object.entries(d).filter(([k]) => k !== 'year' && k !== 'month').reduce((s,[,v])=>s+(v as number||0),0) }))} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fill: grayPalette[5], fontSize: 11 }} axisLine={{ stroke: grayPalette[2] }} tickLine={false} padding={{ left: 10, right: 10 }} />
                        <YAxis tick={{ fill: grayPalette[5], fontSize: 11 }} axisLine={{ stroke: grayPalette[2] }} tickLine={false} tickFormatter={(v) => v.toLocaleString()} width={50} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: grayPalette[3], strokeDasharray: '3 3' }}/>
                        <Line type="monotone" dataKey="total" name="Total Emissions" stroke={trendPalette[0]} strokeWidth={2.5} dot={{ r: 3, fill: trendPalette[0], strokeWidth: 1, stroke: 'white' }} activeDot={{ r: 5, stroke: '#1D4ED8', strokeWidth: 2, fill: 'white' }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>

            {/* Row 2: Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <ChartContainer
                  title={chartMode === "year" ? "Annual Emissions by Campus" : `Monthly Emissions by Campus (${selectedYear})`}
                  isLoading={isLoadingMonthly}
                  actions={chartMode === "month" ? (
                      <button onClick={() => fetchYearlyData()} disabled={isLoadingMonthly} className="flex items-center text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                         Show Annual Comparison
                      </button>
                  ) : undefined}
              >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }} onClick={(e: any) => { if (chartMode === "year" && e?.activePayload?.[0]?.payload?.year) fetchMonthlyData(e.activePayload[0].payload.year); }}>
                       <XAxis dataKey={chartMode === "year" ? "year" : "month"} tickFormatter={(v) => chartMode === "month" ? (monthLabels[parseInt(v)] || v) : v} tick={{ fill: grayPalette[5], fontSize: 11 }} axisLine={{ stroke: grayPalette[2] }} tickLine={false} padding={{ left: 10, right: 10 }} />
                      <YAxis tick={{ fill: grayPalette[5], fontSize: 11 }} axisLine={{ stroke: grayPalette[2] }} tickLine={false} tickFormatter={(v) => v.toLocaleString()} width={50} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: grayPalette[1] }} />
                      <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} formatter={(v) => <span className="text-slate-600">{v}</span>} iconSize={10} />
                      {Object.keys(campusRawData).map((campus, index) => (
                        <Bar key={campus} dataKey={campus} fill={comparisonPalette[index % comparisonPalette.length]} radius={[4, 4, 0, 0]} maxBarSize={40} style={{ cursor: chartMode === 'year' ? 'pointer' : 'default' }}/>
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
              </ChartContainer>

              {/* Breakdown Pie Chart */}
              <ChartContainer
                  title={breakdownTitle}
                  isLoading={isLoadingBreakdown}
                  actions={canGoBackInBreakdown ? (
                      <button onClick={handleBackPie} disabled={isLoadingBreakdown} className="flex items-center text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50 transition-colors">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                         Back {backButtonLabel}
                      </button>
                  ) : undefined}
             >
                <ResponsiveContainer width="100%" height="100%">
                    {breakdownData.length > 0 ? (
                        <PieChart>
                            <Pie data={breakdownData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="85%" innerRadius="55%" labelLine={false} label={renderCustomizedPieLabel} onClick={handlePieClick} stroke={grayPalette[0]} strokeWidth={1} style={{ cursor: isBreakdownPieClickable ? 'pointer' : 'default' }}>
                            {breakdownData.map((_, index) => (<Cell key={`cell-breakdown-${index}`} fill={breakdownPalette[index % breakdownPalette.length]} style={{ filter: 'brightness(95%)' }} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px', fontSize: '12px', lineHeight: '16px', maxHeight: '60px', overflowY: 'auto' }} formatter={(v) => <span className="text-slate-600 truncate" title={v}>{v}</span>} iconSize={10} />
                        </PieChart>
                    ) : ( <div className="flex items-center justify-center h-full text-sm text-slate-400">{isLoadingBreakdown ? 'Loading...' : 'No data available for this level'}</div> )}
                </ResponsiveContainer>
             </ChartContainer>
            </div>

             {/* Row 3: Device Distribution Chart */}
             <ChartContainer title="Emissions by Device Type">
                 <ResponsiveContainer width="100%" height="100%">
                     {devicePieData.length > 0 ? (
                        <PieChart>
                            <Pie data={devicePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="50%" labelLine={false} label={renderCustomizedPieLabel} stroke={grayPalette[0]} strokeWidth={1}>
                                {devicePieData.map((_, index) => (<Cell key={`cell-device-${index}`} fill={devicePiePalette[index % devicePiePalette.length]} style={{ filter: 'brightness(95%)' }} />))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px', fontSize: '12px', lineHeight: '16px' }} formatter={(v) => <span className="text-slate-600">{v}</span>} iconSize={10} />
                        </PieChart>
                     ) : ( <div className="flex items-center justify-center h-full text-sm text-slate-400">No device data available</div> )}
                  </ResponsiveContainer>
             </ChartContainer>
      </main>
    </div>
  ); 
}; 

export default Dashboard;