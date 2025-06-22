"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
import Layout from "@/components/Layout"; // <-- Menggunakan Layout terpusat baru
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps, CartesianGrid
} from "recharts";
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// --- Constants (Tidak ada perubahan) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const trendPalette = ["#2563EB"];
const comparisonPalette = ["#1E3A8A", "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD", "#A78BFA", "#7C3AED", "#F472B6", "#10B981", "#F59E0B"];
const devicePiePalette = ["#10B981", "#F59E0B", "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#F97316", "#14B8A6"];
const slate = { 50:"#F8FAFC", 100:"#F1F5F9", 200:"#E2E8F0", 300:"#CBD5E1", 400:"#94A3B8", 500:"#64748B", 600:"#475569", 700:"#334155", 800:"#1E293B", 900:"#0F172A"};
const monthLabels: { [key: number]: string } = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"};

// --- Interfaces (Tidak ada perubahan) ---
interface DataPoint { year?: string; month?: string; name?: string; total?: number; [key: string]: string | number | undefined; }
interface PieSliceData { name: string; value: number; }
interface RoomData { [roomName: string]: number; }
interface BuildingData { total_emission: number; rooms: RoomData; }
interface BuildingJson { [buildingName: string]: BuildingData; }

// --- Helper Functions (Tidak ada perubahan) ---
const formatNumber = (num: number | undefined | null, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const formatTooltipValue = (value: number): string => `${formatNumber(value, 1)} kg CO₂e`;

// --- Reusable UI Components (Tidak ada perubahan) ---
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
    const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-12 h-12' };
    return <div className={`${sizeClasses[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto`}></div>;
};
interface DashboardCardProps { title: string; value: string | number; unit?: string; icon: ReactNode; isLoading?: boolean; }
const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, unit, icon, isLoading }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow duration-200 min-h-[90px]">
        <div className="flex items-center space-x-4 h-full">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">{icon}</div>
            <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{title}</p>
                {isLoading ? (
                    <div className="h-7 mt-1 w-2/3 bg-slate-200 rounded animate-pulse"></div>
                ) : (
                    <p className="text-2xl font-bold text-slate-800 truncate" title={String(value)}>
                        {typeof value === 'number' ? formatNumber(value) : value}
                        {unit && <span className="text-sm font-medium text-slate-500 ml-1.5">{unit}</span>}
                    </p>
                )}
            </div>
        </div>
    </div>
);
interface ChartContainerProps { title: string; children: ReactNode; isLoading?: boolean; actions?: ReactNode; className?: string; error?: string | null; onZoom?: () => void; noZoom?: boolean; }
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, isLoading, actions, className = "", error = null, onZoom, noZoom = false }) => (
    <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/60 relative min-h-[420px] flex flex-col ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-base lg:text-lg font-semibold text-slate-800 flex-1 truncate">{title}</h2>
            <div className="flex items-center gap-4 flex-shrink-0">
                {actions}
                {!noZoom && onZoom && !isLoading && !error && (
                    <button onClick={onZoom} title="View Full Chart" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        View More >
                    </button>
                )}
            </div>
        </div>
        <div className="h-72 md:h-80 w-full flex-grow">
            {isLoading ? (<div className="w-full h-full flex items-center justify-center"><div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div></div>
            ) : error ? (<div className="flex items-center justify-center h-full text-sm text-red-500 bg-red-50 rounded-lg p-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Error: {error}</div>
            ) : (children)}
        </div>
    </div>
);
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (!active || !payload || !payload.length) return null;
    const dataPoint = payload[0].payload;
    let title = label || dataPoint.name;
    if (dataPoint.year && dataPoint.month) title = `${monthLabels[parseInt(dataPoint.month)] || dataPoint.month} ${dataPoint.year}`;
    else if (dataPoint.year) title = `Year ${dataPoint.year}`;
    else if (dataPoint.month) title = `${monthLabels[parseInt(dataPoint.month)] || dataPoint.month}`;
    return (
        <div className="bg-white/80 p-3 rounded-lg shadow-lg border border-slate-200/80 text-xs backdrop-blur-sm">
            <p className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1.5">{String(title)}</p>
            <div className="space-y-1">
                {payload.map((entry, index) => (
                    <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
                        <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color || entry.payload?.fill || '#8884d8' }}></span><span className="text-slate-500 truncate">{String(entry.name)}:</span></div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{formatTooltipValue(entry.value as number)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (<text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold pointer-events-none drop-shadow-sm">{`${(percent * 100).toFixed(0)}%`}</text>);
};
interface ChartModalProps { isOpen: boolean; onClose: () => void; title: string; chartData: any[]; chartType: 'bar' | 'pie'; dataKey: string; nameKey?: string; xAxisDataKey?: string; colors?: string[]; }
const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, title, chartData, chartType, dataKey, nameKey, xAxisDataKey, colors = comparisonPalette }) => {
    if (!isOpen) return null;
    const renderChart = () => {
        if (chartType === 'bar') {
            const BAR_HEIGHT = 20, BAR_GAP = 14, CHART_VERTICAL_PADDING = 80, MIN_CHART_HEIGHT = 400;
            const calculatedHeight = Math.max(MIN_CHART_HEIGHT, chartData.length * (BAR_HEIGHT + BAR_GAP) + CHART_VERTICAL_PADDING);
            return (
                <ResponsiveContainer width="100%" height={calculatedHeight}>
                    <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={slate[200]} />
                        <XAxis type="number" tick={{ fill: slate[500], fontSize: 12 }} tickFormatter={(v) => formatNumber(v, 0)} />
                        <YAxis type="category" dataKey={xAxisDataKey || "name"} width={220} tick={{ fill: slate[600], fontSize: 12, width: 210 }} interval={0} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ position: 'relative', top: '10px' }}/>
                        <Bar dataKey={dataKey} name="Emissions" radius={[0, 4, 4, 0]} barSize={BAR_HEIGHT}>
                            {chartData.map((_, index) => <Cell key={`cell-modal-${index}`} fill={colors[index % colors.length]} />)}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );
        }
        if (chartType === 'pie') {
            return (
                <ResponsiveContainer width="100%" height={500}>
                    <PieChart>
                        <Pie data={chartData} dataKey={dataKey} nameKey={nameKey || "name"} cx="50%" cy="45%" outerRadius="85%" labelLine={false} label={renderCustomizedPieLabel}>
                            {chartData.map((_, index) => <Cell key={`cell-modal-pie-${index}`} fill={colors[index % colors.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                    </PieChart>
                </ResponsiveContainer>
            );
        }
        return <p>Unsupported chart type.</p>;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="p-5 flex-grow overflow-y-auto">{renderChart()}</div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component (Hooks dan Logic tidak berubah) ---
const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardSelectedYear, setDashboardSelectedYear] = useState<string>("All");
  const [yearlyTrendData, setYearlyTrendData] = useState<DataPoint[]>([]);
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [grandTotalEmissions, setGrandTotalEmissions] = useState<number | null>(null);
  const [monthlyTrendData, setMonthlyTrendData] = useState<DataPoint[]>([]);
  const [chartMode, setChartMode] = useState<"year" | "month">("year");
  const [selectedYearForMonthly, setSelectedYearForMonthly] = useState<string | null>(null);
  const [totalEmissions, setTotalEmissions] = useState<number | null>(null);
  const [topEmittingBuildingName, setTopEmittingBuildingName] = useState<string | null>(null);
  const [devicePieData, setDevicePieData] = useState<PieSliceData[]>([]);
  const [allDeviceDataForModal, setAllDeviceDataForModal] = useState<PieSliceData[]>([]);
  const [allBuildingsChartData, setAllBuildingsChartData] = useState<PieSliceData[]>([]);
  const [allBuildingsData, setAllBuildingsData] = useState<BuildingJson | null>(null);
  const [selectedBuildingForRooms, setSelectedBuildingForRooms] = useState<string>("");
  const [roomChartData, setRoomChartData] = useState<PieSliceData[]>([]);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [modalChartConfig, setModalChartConfig] = useState<Omit<ChartModalProps, 'isOpen' | 'onClose' > | null>(null);
  const fetchApi = useCallback(async <T,>(relativePath: string): Promise<T> => {
    const fullUrl = `/api${relativePath}`;
    const res = await fetch(fullUrl);
    if (!res.ok) {
        const errTxt = await res.text();
        console.error(`API Error ${res.status} on ${fullUrl}: ${errTxt}`);
        throw new Error(`Failed to fetch data from ${relativePath}. Status: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }, []);
  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            const trendJson = await fetchApi<{ emissions: { [c: string]: { [y: string]: number } }, total_emissions?: { [c:string]: number } }>("/emissions/campus?year=All&aggregate=yearly_total");
            const emissions = trendJson.emissions;
            const structured: DataPoint[] = [];
            const yearsSet = new Set<string>();
            Object.values(emissions).forEach(yearData => { Object.entries(yearData).forEach(([y, val]) => { yearsSet.add(y); let e = structured.find(d => d.year === y); if (!e) { e = { year: y, total: 0 }; structured.push(e); } (e.total as number) += val; }); });
            let grandTotal = 0;
            if (trendJson.total_emissions) { grandTotal = Object.values(trendJson.total_emissions).reduce((s, v) => s + v, 0); }
            else { grandTotal = structured.reduce((s, i) => s + (i.total || 0), 0); }
            setYearlyTrendData(structured.sort((a, b) => parseInt(a.year!) - parseInt(b.year!)));
            setGrandTotalEmissions(grandTotal);
            setAvailableYears(Array.from(yearsSet).sort((a,b) => parseInt(b) - parseInt(a)));
        } catch (err: any) { setError(err.message); }
    };
    fetchInitialData();
  }, [fetchApi]);
  useEffect(() => {
    const fetchFilteredData = async () => {
        setIsLoading(true);
        setError(null);
        setSelectedBuildingForRooms("");
        setRoomChartData([]);
        try {
            const buildingJson = await fetchApi<{ buildings: BuildingJson }>(`/emissions/building?year=${encodeURIComponent(dashboardSelectedYear)}`);
            const buildings = buildingJson.buildings;
            const buildingRawData = Object.entries(buildings).map(([name, data]) => ({ name, value: data.total_emission })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
            const currentTotal = buildingRawData.reduce((sum, item) => sum + item.value, 0);
            setTotalEmissions(currentTotal);
            setTopEmittingBuildingName(buildingRawData.length > 0 ? buildingRawData[0].name : null);
            setAllBuildingsChartData(buildingRawData);
            setAllBuildingsData(buildings);
            const deviceJson = await fetchApi<{ device_emissions?: { [key: string]: number } }>(`/emissions/device?year=${encodeURIComponent(dashboardSelectedYear)}`);
            if (deviceJson.device_emissions) {
                const rawDeviceData = Object.entries(deviceJson.device_emissions).map(([name, value]) => ({ name, value })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
                setAllDeviceDataForModal(rawDeviceData);
                let pieDataStructured: PieSliceData[] = [], otherValue = 0, TOP_N_PIE_DEVICES = 6;
                rawDeviceData.forEach((item, i) => i < TOP_N_PIE_DEVICES ? pieDataStructured.push(item) : otherValue += item.value);
                if (otherValue > 0) pieDataStructured.push({ name: "Others", value: otherValue });
                setDevicePieData(pieDataStructured);
            } else {
                setDevicePieData([]); setAllDeviceDataForModal([]);
            }
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };
    fetchFilteredData();
  }, [dashboardSelectedYear, fetchApi]);
  useEffect(() => {
    if (selectedBuildingForRooms && allBuildingsData) {
        const building = allBuildingsData[selectedBuildingForRooms];
        if (building?.rooms) {
            const roomsData = Object.entries(building.rooms).map(([name, value]) => ({ name, value })).filter(item => item.value > 0).sort((a, b) => b.value - a.value);
            setRoomChartData(roomsData);
        } else { setRoomChartData([]); }
    } else { setRoomChartData([]); }
  }, [selectedBuildingForRooms, allBuildingsData]);
  const fetchMonthlyTrend = useCallback(async (year: string) => {
    setSelectedYearForMonthly(year);
    setChartMode("month");
    setError(null);
    try {
        const json = await fetchApi<{ emissions: { [c: string]: { [m: string]: number }} }>(`/emissions/campus?year=${year}&aggregate=monthly_total`);
        const structured: DataPoint[] = [];
        Object.values(json.emissions).forEach(monthData => {Object.entries(monthData).forEach(([month, val]) => { let e = structured.find(d => d.month === month); if (!e) { e = { month, total: 0 }; structured.push(e); } (e.total as number) += val; });});
        setMonthlyTrendData(structured.sort((a, b) => parseInt(a.month!) - parseInt(b.month!)));
    } catch (err: any) { setError(err.message); }
  }, [fetchApi]);

  const displayedTotalEmissions = dashboardSelectedYear === "All" && grandTotalEmissions !== null ? grandTotalEmissions : totalEmissions;
  const averageMonthlyEmission = dashboardSelectedYear === "All" 
      ? (grandTotalEmissions && availableYears.length > 0 ? grandTotalEmissions / (availableYears.length * 12) : null)
      : (totalEmissions !== null ? totalEmissions / 12 : null);

  const handleOpenBuildingChartModal = () => {setModalChartConfig({title: `All Building Emissions (${dashboardSelectedYear})`, chartData: allBuildingsChartData, chartType: 'bar', dataKey: 'value', xAxisDataKey: 'name', colors: comparisonPalette}); setIsChartModalOpen(true);};
  const handleOpenDeviceChartModal = () => {setModalChartConfig({title: `All Device Emissions (${dashboardSelectedYear})`, chartData: allDeviceDataForModal, chartType: 'pie', dataKey: 'value', nameKey: 'name', colors: devicePiePalette}); setIsChartModalOpen(true);};
  const handleOpenRoomChartModal = () => {setModalChartConfig({title: `Room Emissions in ${selectedBuildingForRooms} (${dashboardSelectedYear})`, chartData: roomChartData, chartType: 'bar', dataKey: 'value', xAxisDataKey: 'name', colors: comparisonPalette}); setIsChartModalOpen(true);};

  return (
    <Layout
      title="Carbon Emissions Dashboard"
      subtitle="An overview of ITB's carbon footprint."
      headerActions={
          <div className="relative w-full sm:w-auto">
              <select
                  value={dashboardSelectedYear}
                  onChange={(e) => setDashboardSelectedYear(e.target.value)}
                  className="w-full sm:w-40 appearance-none text-sm pl-3 pr-10 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                  disabled={isLoading || availableYears.length === 0}
              >
                  <option value="All">All Years</option>
                  {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 8l4 4 4-4" /></svg>
              </div>
          </div>
      }
    >
      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <DashboardCard title={`Total Emissions (${dashboardSelectedYear})`} value={displayedTotalEmissions ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} isLoading={isLoading} />
          <DashboardCard title={`Top Emitter (${dashboardSelectedYear})`} value={topEmittingBuildingName ?? 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 110-2V4zm3 1h2v1H7V5zm0 2h2v1H7V7zm0 2h2v1H7V9zm0 2h2v1H7v-1zm4-6h2v1h-2V5zm0 2h2v1h-2V7zm0 2h2v1h-2V9zm0 2h2v1h-2v-1z" clipRule="evenodd" /></svg>} isLoading={isLoading} />
          <DashboardCard title={`Avg. Monthly (${dashboardSelectedYear})`} value={averageMonthlyEmission ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} isLoading={isLoading} />
      </div>

      {/* Grid untuk Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartContainer
            title={chartMode === 'year' ? "Annual Emissions Trend (All Campuses)" : `Monthly Trend for ${selectedYearForMonthly}`}
            isLoading={yearlyTrendData.length === 0 && !error} error={error} noZoom={true}
            actions={
                <div className="flex items-center space-x-2">
                    {chartMode === 'month' ? (
                        <button onClick={() => { setChartMode("year"); setSelectedYearForMonthly(null); }} disabled={isLoading} className="flex items-center text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            Annual
                        </button>
                    ) : availableYears.slice(0, 3).map(year => (
                        <button key={year} onClick={() => fetchMonthlyTrend(year)} disabled={isLoading} className="px-3 py-1 text-xs rounded-full font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50">{year}</button>
                    ))}
                </div>
            }
        >
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartMode === 'year' ? yearlyTrendData.map(d => ({...d, name: d.year})) : monthlyTrendData.map(d => ({...d, name: monthLabels[parseInt(d.month!)] || d.month}))} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={slate[200]} />
                    <XAxis dataKey="name" tick={{ fill: slate[500], fontSize: 11 }} axisLine={{ stroke: slate[300] }} tickLine={false} padding={{ left: 10, right: 10 }} />
                    <YAxis tick={{ fill: slate[500], fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatNumber(v,0)} width={50} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: slate[400], strokeDasharray: '4 4' }}/>
                    <Legend wrapperStyle={{fontSize: '12px', color: slate[600]}}/>
                    <Line type="monotone" dataKey="total" name="Total Emissions" stroke={trendPalette[0]} strokeWidth={2.5} dot={{ r: 4, fill: trendPalette[0], strokeWidth: 2, stroke: 'white' }} activeDot={{ r: 6 }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
            title={`Emissions by Device Type (${dashboardSelectedYear})`}
            isLoading={isLoading} error={error}
            onZoom={allDeviceDataForModal.length > 0 ? handleOpenDeviceChartModal : undefined}
        >
            <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                    <Pie data={devicePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius="80%" labelLine={false} label={renderCustomizedPieLabel} stroke={slate[50]} strokeWidth={2}>
                        {devicePieData.map((_, index) => (<Cell key={`cell-dev-${index}`} fill={devicePiePalette[index % devicePiePalette.length]} />))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px', fontSize: '12px', lineHeight: '18px' }} formatter={(v) => <span className="text-slate-600">{v}</span>} iconSize={10} />
                </PieChart>
            </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
            title={`Top 10 Emitters (Buildings, ${dashboardSelectedYear})`}
            isLoading={isLoading} error={error}
            onZoom={allBuildingsChartData.length > 0 ? handleOpenBuildingChartModal : undefined}
        >
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allBuildingsChartData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={slate[200]} horizontal={false} />
                    <XAxis type="number" tick={{ fill: slate[500], fontSize: 11 }} axisLine={{ stroke: slate[300] }} tickLine={false} tickFormatter={(v) => formatNumber(v,0)} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fill: slate[600], fontSize: 11, width: 130 }} interval={0} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: slate[100] }}/>
                    <Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>
                        {allBuildingsChartData.slice(0, 10).map((_, index) => ( <Cell key={`cell-bldg-${index}`} fill={comparisonPalette[index % comparisonPalette.length]} /> ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer
            title={`Top 10 Emitters (Rooms) ${selectedBuildingForRooms ? `in ${selectedBuildingForRooms}` : ''}`}
            isLoading={isLoading && !selectedBuildingForRooms} error={error}
            onZoom={roomChartData.length > 0 ? handleOpenRoomChartModal : undefined}
            actions={
                <div className="relative w-48">
                    <select
                        value={selectedBuildingForRooms}
                        onChange={e => setSelectedBuildingForRooms(e.target.value)}
                        disabled={isLoading || !allBuildingsData}
                        className="w-full appearance-none truncate text-xs pl-3 pr-8 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition"
                    >
                        <option value="">Select Building</option>
                        {allBuildingsData && Object.keys(allBuildingsData).sort().map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    </div>
                </div>
            }
        >
            {!selectedBuildingForRooms ? (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">Please select a building to view room data.</div>
            ) : roomChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roomChartData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={slate[200]} horizontal={false} />
                        <XAxis type="number" tick={{ fill: slate[500], fontSize: 11 }} axisLine={{ stroke: slate[300] }} tickLine={false} tickFormatter={(v) => formatNumber(v,0)} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fill: slate[600], fontSize: 11, width: 130 }} interval={0} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: slate[100] }}/>
                        <Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>
                            {roomChartData.slice(0, 10).map((_, index) => ( <Cell key={`cell-room-${index}`} fill={comparisonPalette[index % comparisonPalette.length]} /> ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">No room emission data for this building.</div>
            )}
        </ChartContainer>
      </div>

      {modalChartConfig && (
          <ChartModal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} {...modalChartConfig} />
      )}
    </Layout>
  );
};

export default Dashboard;