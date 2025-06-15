// src/pages/carbon-dashboard.tsx
"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/router";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps, CartesianGrid
} from "recharts";
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const trendPalette = ["#2563EB"]; // blue-600
const comparisonPalette = ["#1E3A8A", "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD", "#A78BFA", "#7C3AED", "#F472B6"];
const devicePiePalette = ["#10B981", "#F59E0B", "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#F97316", "#14B8A6"];
const slate = { 50:"#F8FAFC", 100:"#F1F5F9", 200:"#E2E8F0", 300:"#CBD5E1", 400:"#94A3B8", 500:"#64748B", 600:"#475569", 700:"#334155", 800:"#1E293B", 900:"#0F172A"};
const monthLabels: { [key: number]: string } = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"};

// --- Interfaces ---
interface DataPoint { year?: string; month?: string; name?: string; total?: number; [key: string]: string | number | undefined; }
interface CampusData { [campus: string]: { [yearOrMonth: string]: number; }; }
interface TotalEmissionsByCampus { [campus:string]: number; }
interface PieSliceData { name: string; value: number; }
interface RoomData { [roomName: string]: number; }
interface BuildingData { total_emission: number; rooms: RoomData; }
interface BuildingJson { [buildingName: string]: BuildingData; }

// --- Helper Functions ---
const formatNumber = (num: number | undefined | null, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const formatTooltipValue = (value: number): string => `${formatNumber(value, 1)} kg CO₂e`;

// --- Reusable UI Components ---
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

interface ChartContainerProps { title: string; children: ReactNode; isLoading?: boolean; actions?: ReactNode; className?: string; error?: string | null; onZoom?: () => void; }
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, isLoading, actions, className = "", error = null, onZoom }) => (
    <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/60 relative min-h-[380px] flex flex-col ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-base lg:text-lg font-semibold text-slate-800 flex-1 truncate">{title}</h2>
            <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
                {onZoom && !isLoading && !error && (
                    <button onClick={onZoom} title="View Full Chart" className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5" /></svg>
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

// --- Main Dashboard Component ---
const Dashboard = () => {
    const router = useRouter();
    // --- Semua state sama, hanya di-collapse ---
    const [yearlyTrendData, setYearlyTrendData] = useState<DataPoint[]>([]);const [monthlyTrendData, setMonthlyTrendData] = useState<DataPoint[]>([]);const [isLoadingYearlyTrend, setIsLoadingYearlyTrend] = useState(true);const [isLoadingMonthlyTrend, setIsLoadingMonthlyTrend] = useState(false);const [trendChartError, setTrendChartError] = useState<string | null>(null);const [campusPieData, setCampusPieData] = useState<PieSliceData[]>([]);const [isLoadingCampusPie, setIsLoadingCampusPie] = useState(true);const [campusPieError, setCampusPieError] = useState<string | null>(null);const [devicePieData, setDevicePieData] = useState<PieSliceData[]>([]);const [allDeviceDataForModal, setAllDeviceDataForModal] = useState<PieSliceData[]>([]);const [isLoadingDevicePie, setIsLoadingDevicePie] = useState(true);const [devicePieError, setDevicePieError] = useState<string | null>(null);const [allBuildingsChartData, setAllBuildingsChartData] = useState<PieSliceData[]>([]);const [isLoadingAllBuildingsChart, setIsLoadingAllBuildingsChart] = useState(true);const [allBuildingsChartError, setAllBuildingsChartError] = useState<string | null>(null);const [totalEmissions, setTotalEmissions] = useState<number | null>(null);const [isLoadingTotalEmissions, setIsLoadingTotalEmissions] = useState(true);const [topEmittingBuildingName, setTopEmittingBuildingName] = useState<string | null>(null);const [isLoadingTopBuilding, setIsLoadingTopBuilding] = useState(true);const [selectedYearForMonthly, setSelectedYearForMonthly] = useState<string | null>(null);const [chartMode, setChartMode] = useState<"year" | "month">("year");const [availableYears, setAvailableYears] = useState<string[]>([]);const [dashboardSelectedYear, setDashboardSelectedYear] = useState<string>("All");const [isChartModalOpen, setIsChartModalOpen] = useState(false);const [modalChartConfig, setModalChartConfig] = useState<Omit<ChartModalProps, 'isOpen' | 'onClose' > | null>(null);

    // --- Semua fungsi fetch sama, hanya di-collapse ---
    const fetchApi = useCallback(async <T,>(relativePath: string): Promise<T> => {const fullUrl = `${API_BASE_URL}${relativePath}`;const res = await fetch(fullUrl);if (!res.ok) {const errTxt = await res.text();console.error(`API Error ${res.status} on ${fullUrl}: ${errTxt}`);throw new Error(`API Error ${res.status}`)}return res.json() as Promise<T>;}, []);
    const fetchYearlyTrend = useCallback(async () => {setIsLoadingYearlyTrend(true); setTrendChartError(null); setIsLoadingTotalEmissions(true);try {const json = await fetchApi<{ emissions: CampusData, total_emissions?: TotalEmissionsByCampus }>("/emissions/campus?year=All&aggregate=yearly_total");const emissions = json.emissions;const structured: DataPoint[] = [];let currentTotalEmissions = 0;const yearsSet = new Set<string>();Object.values(emissions).forEach(yearData => {Object.entries(yearData).forEach(([year, emissionVal]) => {yearsSet.add(year);let existing = structured.find((d) => d.year === year);if (!existing) { existing = { year, total: 0 }; structured.push(existing); }(existing.total as number) += emissionVal;});});if (json.total_emissions && Object.keys(json.total_emissions).length > 0) {currentTotalEmissions = Object.values(json.total_emissions).reduce((sum, val) => sum + val, 0);} else {currentTotalEmissions = structured.reduce((sum, item) => sum + (item.total || 0), 0);}structured.sort((a, b) => parseInt(a.year!) - parseInt(b.year!));setYearlyTrendData(structured);setTotalEmissions(currentTotalEmissions);setAvailableYears(Array.from(yearsSet).sort((a,b) => parseInt(b) - parseInt(a)));} catch (err: any) { setTrendChartError(err.message); setTotalEmissions(null); }finally { setIsLoadingYearlyTrend(false); setIsLoadingTotalEmissions(false); }}, [fetchApi]);
    const fetchMonthlyTrend = useCallback(async (year: string) => {setSelectedYearForMonthly(year); setIsLoadingMonthlyTrend(true); setTrendChartError(null); setChartMode("month");try {const json = await fetchApi<{ emissions: CampusData }>(`/emissions/campus?year=${year}&aggregate=monthly_total`);const emissions = json.emissions;const structured: DataPoint[] = [];Object.values(emissions).forEach(monthData => {Object.entries(monthData).forEach(([month, emissionVal]) => {let existing = structured.find((d) => d.month === month);if (!existing) { existing = { month, total: 0 }; structured.push(existing); }(existing.total as number) += emissionVal;});});structured.sort((a, b) => parseInt(a.month!) - parseInt(b.month!));setMonthlyTrendData(structured);} catch (err: any) { setTrendChartError(err.message); }finally { setIsLoadingMonthlyTrend(false); }}, [fetchApi]);
    const fetchAllBuildingsBar = useCallback(async (year: string = "All") => {setIsLoadingAllBuildingsChart(true); setAllBuildingsChartError(null); setIsLoadingTopBuilding(true);try {const apiUrl = `/emissions/building?year=${encodeURIComponent(year)}`;const json = await fetchApi<{ buildings: BuildingJson }>(apiUrl);const buildings = json.buildings;const rawData = Object.entries(buildings).map(([name, data]) => ({ name, value: data.total_emission })).filter(item => item.value > 0);rawData.sort((a, b) => b.value - a.value);setTopEmittingBuildingName(rawData.length > 0 ? rawData[0].name : null);setAllBuildingsChartData(rawData);} catch (err: any) { setAllBuildingsChartError(err.message); setAllBuildingsChartData([]); setTopEmittingBuildingName(null); }finally { setIsLoadingAllBuildingsChart(false); setIsLoadingTopBuilding(false); }}, [fetchApi]);
    const fetchDevicePie = useCallback(async (year: string = "All") => {setIsLoadingDevicePie(true); setDevicePieError(null);try {const apiUrl = `/emissions/device?year=${encodeURIComponent(year)}`;const json = await fetchApi<{ device_emissions?: { [key: string]: number } }>(apiUrl);if (!json.device_emissions) { setDevicePieData([]); setAllDeviceDataForModal([]); setIsLoadingDevicePie(false); return; }const rawDeviceData = Object.entries(json.device_emissions).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);rawDeviceData.sort((a, b) => b.value - a.value);setAllDeviceDataForModal(rawDeviceData);let pieDataStructured: PieSliceData[] = [];let otherValue = 0;const TOP_N_PIE_DEVICES = 6;for (let i = 0; i < rawDeviceData.length; i++) {if (i < TOP_N_PIE_DEVICES) pieDataStructured.push(rawDeviceData[i]);else otherValue += rawDeviceData[i].value;}if (otherValue > 0) pieDataStructured.push({ name: "Others", value: otherValue });setDevicePieData(pieDataStructured);} catch (err: any) { setDevicePieError(err.message); setDevicePieData([]); setAllDeviceDataForModal([]); }finally { setIsLoadingDevicePie(false); }}, [fetchApi]);
    useEffect(() => {fetchYearlyTrend(); fetchAllBuildingsBar("All"); fetchDevicePie("All");}, [fetchYearlyTrend, fetchAllBuildingsBar, fetchDevicePie]);
    useEffect(() => {if (!isLoadingYearlyTrend && availableYears.length > 0) {fetchAllBuildingsBar(dashboardSelectedYear);fetchDevicePie(dashboardSelectedYear);}}, [dashboardSelectedYear, isLoadingYearlyTrend, availableYears, fetchAllBuildingsBar, fetchDevicePie]);
    const averageMonthlyEmission = totalEmissions !== null && yearlyTrendData.length > 0 ? totalEmissions / (yearlyTrendData.length * 12) : null;
    const handleOpenBuildingChartModal = () => {setModalChartConfig({title: `All Building Emissions (${dashboardSelectedYear})`, chartData: allBuildingsChartData, chartType: 'bar', dataKey: 'value', xAxisDataKey: 'name', colors: comparisonPalette}); setIsChartModalOpen(true);};
    const handleOpenDeviceChartModal = () => {setModalChartConfig({title: `All Device Emissions (${dashboardSelectedYear})`, chartData: allDeviceDataForModal, chartType: 'pie', dataKey: 'value', nameKey: 'name', colors: devicePiePalette}); setIsChartModalOpen(true);};
  
    return (
        <div className="p-4 md:p-6 lg:p-8 bg-slate-50 min-h-screen font-sans">
            <header className="mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
                            Carbon Emissions Dashboard
                        </h1>
                        <p className="text-slate-500 mt-1">An overview of ITB's carbon footprint.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <select
                            value={dashboardSelectedYear}
                            onChange={(e) => setDashboardSelectedYear(e.target.value)}
                            className="w-full sm:w-auto text-sm px-3 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition"
                            disabled={isLoadingYearlyTrend || (availableYears.length <= 1 && !isLoadingYearlyTrend)}
                        >
                            <option value="All">All Years</option>
                            {availableYears.filter(y => y !== "All").map(year => (<option key={year} value={year}>{year}</option>))}
                        </select>
                        <button onClick={() => router.push("/")} className="flex-shrink-0 flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-100">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            Back
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    <DashboardCard title="Total Tracked Emissions" value={totalEmissions ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} isLoading={isLoadingTotalEmissions} />
                    <DashboardCard title="Top Emitter (Building)" value={topEmittingBuildingName ?? 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 110-2V4zm3 1h2v1H7V5zm0 2h2v1H7V7zm0 2h2v1H7V9zm0 2h2v1H7v-1zm4-6h2v1h-2V5zm0 2h2v1h-2V7zm0 2h2v1h-2V9zm0 2h2v1h-2v-1z" clipRule="evenodd" /></svg>} isLoading={isLoadingTopBuilding} />
                    <DashboardCard title="Avg. Monthly Emission" value={averageMonthlyEmission ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} isLoading={isLoadingTotalEmissions} />
                </div>
            </header>

            <main className="space-y-6">
                <ChartContainer
                    title={chartMode === 'year' ? "Annual Emissions Trend (All Campuses)" : `Monthly Emissions Trend for ${selectedYearForMonthly}`}
                    isLoading={chartMode === 'year' ? isLoadingYearlyTrend : isLoadingMonthlyTrend}
                    error={trendChartError}
                    actions={
                        <div className="flex items-center space-x-2">
                            {chartMode === 'year' && availableYears.filter(y => y !== "All").slice(0, 4).map(year => (
                                <button key={year} onClick={() => fetchMonthlyTrend(year)} disabled={isLoadingMonthlyTrend} className="px-3 py-1 text-xs rounded-full font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50">{year}</button>
                            ))}
                            {chartMode === 'month' && (
                                <button onClick={() => { setChartMode("year"); setSelectedYearForMonthly(null); }} disabled={isLoadingYearlyTrend} className="flex items-center text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-md shadow-sm hover:bg-slate-50 disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                    Annual Trend
                                </button>
                            )}
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartContainer
                        title={`Top 10 Emitters (Buildings, ${dashboardSelectedYear})`}
                        isLoading={isLoadingAllBuildingsChart}
                        error={allBuildingsChartError}
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
                        title={`Emissions by Device Type (${dashboardSelectedYear})`}
                        isLoading={isLoadingDevicePie}
                        error={devicePieError}
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
                </div>
            </main>

            {modalChartConfig && (
                <ChartModal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} {...modalChartConfig} />
            )}
        </div>
    );
};

export default Dashboard;