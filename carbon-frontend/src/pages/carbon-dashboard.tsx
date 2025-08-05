"use client";

import React, { useEffect, useState, useCallback, ReactNode } from "react";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, TooltipProps, CartesianGrid
} from "recharts";
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const trendPalette = ["#2563EB"];
const comparisonPalette = ["#1E3A8A", "#1D4ED8", "#3B82F6", "#60A5FA", "#93C5FD", "#A78BFA", "#7C3AED", "#F472B6", "#10B981", "#F59E0B"];
const devicePiePalette = ["#10B981", "#F59E0B", "#6366F1", "#8B5CF6", "#EC4899", "#3B82F6", "#F97316", "#14B8A6"];
const slate = { 50:"#F8FAFC", 100:"#F1F5F9", 200:"#E2E8F0", 300:"#CBD5E1", 400:"#94A3B8", 500:"#64748B", 600:"#475569", 700:"#334155", 800:"#1E293B", 900:"#0F172A"};
const monthLabels: { [key: number]: string } = {1:"Jan",2:"Feb",3:"Mar",4:"Apr",5:"May",6:"Jun",7:"Jul",8:"Aug",9:"Sep",10:"Oct",11:"Nov",12:"Dec"};

interface ChartData { name: string; value: number; rank?: number }
interface RoomData { [roomName: string]: number; }
interface BuildingData { total_emission: number; rooms: RoomData; }
interface BuildingJson { [buildingName: string]: BuildingData; }
interface TableColumn { header: string; accessor: string; format?: (value: any) => string | number; }
interface ChartModalProps { isOpen: boolean; onClose: () => void; title: string; chartData: any[]; chartType: 'bar' | 'pie'; dataKey: string; nameKey?: string; xAxisDataKey?: string; colors?: string[]; enableTableView?: boolean; tableColumns?: TableColumn[]; }

interface CampusApiResponse {
  total_emissions?: { [campusName: string]: number };
  emissions?: { [campusName: string]: { [time: string]: number } };
}
interface DeviceApiResponse {
  device_emissions?: { [deviceName: string]: number };
}
interface BuildingApiResponse {
  buildings: BuildingJson;
}

const formatNumber = (num: number | undefined | null, decimals = 0): string => {
  if (num === undefined || num === null || isNaN(num)) return "N/A";
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};
const formatTooltipValue = (value: number): string => `${formatNumber(value, 1)} kg CO₂e`;

interface CustomYAxisTickProps { x?: number; y?: number; payload?: { value: string }; }
const CustomYAxisTick: React.FC<CustomYAxisTickProps> = ({ x, y, payload }) => {
  const text = payload?.value || '';
  const MAX_CHARS = 25;
  if (!text) return null;
  if (text.length <= MAX_CHARS) return <g transform={`translate(${x},${y})`}><text x={0} y={0} dy={4} textAnchor="end" fill={slate[600]} className="text-xs">{text}</text></g>;
  const splitIndex = text.lastIndexOf(' ', MAX_CHARS) || MAX_CHARS;
  const line1 = text.substring(0, splitIndex);
  let line2 = text.substring(splitIndex + 1);
  if (line2.length > MAX_CHARS) line2 = line2.substring(0, MAX_CHARS - 3) + '...';
  return <g transform={`translate(${x},${y})`}><text x={0} y={-5} textAnchor="end" fill={slate[600]} className="text-xs"><tspan x={0}>{line1}</tspan><tspan x={0} dy="1.2em">{line2}</tspan></text></g>;
};

interface DashboardCardProps { title: string; value: string | number; unit?: string; icon: ReactNode; isLoading?: boolean; }
const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, unit, icon, isLoading }) => (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow duration-200 min-h-[90px]">
        <div className="flex items-center space-x-4 h-full">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">{icon}</div>
            <div className="flex-1 overflow-hidden">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider truncate">{title}</p>
                {isLoading ? <div className="h-7 mt-1 w-2/3 bg-slate-200 rounded animate-pulse"></div> : <p className="text-2xl font-bold text-slate-800 truncate" title={String(value)}>{typeof value === 'number' ? formatNumber(value) : value}{unit && <span className="text-sm font-medium text-slate-500 ml-1.5">{unit}</span>}</p>}
            </div>
        </div>
    </div>
);
interface ChartContainerProps { title: string; children: ReactNode; isLoading?: boolean; actions?: ReactNode; error?: string | null; onZoom?: () => void; noZoom?: boolean; }
const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, isLoading, actions, error = null, onZoom, noZoom = false }) => (
    <div className={`bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-slate-200/60 relative min-h-[420px] flex flex-col`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <h2 className="text-base lg:text-lg font-semibold text-slate-800 flex-1 truncate">{title}</h2>
            <div className="flex items-center gap-4 flex-shrink-0">
                {actions}
                {!noZoom && onZoom && !isLoading && !error && <button onClick={onZoom} title="View Full Chart" className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">View More {'>'}</button>}
            </div>
        </div>
        <div className="h-72 md:h-80 w-full flex-grow">
            {isLoading ? <div className="w-full h-full flex items-center justify-center"><div className="w-full h-full bg-slate-100 rounded-lg animate-pulse"></div></div> : error ? <div className="flex items-center justify-center h-full text-sm text-red-500 bg-red-50 rounded-lg p-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>Error: {error}</div> : children}
        </div>
    </div>
);
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white/80 p-3 rounded-lg shadow-lg border border-slate-200/80 text-xs backdrop-blur-sm">
            <p className="font-semibold text-slate-700 mb-2 border-b border-slate-200 pb-1.5">{String(label)}</p>
            {payload.map((entry, index) => <div key={`item-${index}`} className="flex items-center justify-between space-x-4"><div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color || '#8884d8' }}></span><span className="text-slate-500">{String(entry.name)}:</span></div><span className="font-medium text-slate-800">{formatTooltipValue(entry.value as number)}</span></div>)}
        </div>
    );
};
const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[11px] font-bold pointer-events-none drop-shadow-sm">{`${(percent * 100).toFixed(0)}%`}</text>;
};
const ChartModal: React.FC<ChartModalProps> = ({ isOpen, onClose, title, chartData, chartType, dataKey, nameKey, xAxisDataKey, colors = comparisonPalette, enableTableView = false, tableColumns = [] }) => {
    return null;
};

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedCampus, setSelectedCampus] = useState<string>("All");
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([]);
  
  const [totalEmissions, setTotalEmissions] = useState<number | null>(null);
  const [topEmitterName, setTopEmitterName] = useState<string | null>(null);
  
  const [trendData, setTrendData] = useState<any[]>([]);
  const [devicePieData, setDevicePieData] = useState<ChartData[]>([]);
  const [campusChartData, setCampusChartData] = useState<ChartData[]>([]);
  const [buildingChartData, setBuildingChartData] = useState<ChartData[]>([]);
  const [allBuildingsData, setAllBuildingsData] = useState<BuildingJson | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [roomChartData, setRoomChartData] = useState<ChartData[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<Omit<ChartModalProps, 'isOpen' | 'onClose' > | null>(null);

  const fetchApi = useCallback(async <T,>(relativePath: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${relativePath}`);
    if (!res.ok) throw new Error(`API call to ${relativePath} failed`);
    return res.json();
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
        try {
            const data = await fetchApi<CampusApiResponse>("/emissions/campus");
            const years = new Set<string>();
            const campuses = new Set<string>();
            Object.entries(data.emissions || {}).forEach(([campus, yearData]) => {
                campuses.add(campus);
                Object.keys(yearData).forEach(year => years.add(year));
            });
            setAvailableYears(["All", ...Array.from(years).sort((a,b) => parseInt(b) - parseInt(a))]);
            setAvailableCampuses(["All", ...Array.from(campuses).sort()]);
        } catch (err: any) { setError(err.message); }
    };
    fetchFilters();
  }, [fetchApi]);

  useEffect(() => {
    const fetchDashboardData = async () => {
        setIsLoading(true);
        setError(null);
        setSelectedBuilding("");
        setRoomChartData([]);

        try {
            const campusPromise = fetchApi<CampusApiResponse>(`/emissions/campus?year=${selectedYear}&aggregate=total`);
            const devicePromise = fetchApi<DeviceApiResponse>(`/emissions/device?year=${selectedYear}&campus=${selectedCampus}`);
            const trendPromise = fetchApi<CampusApiResponse>(`/emissions/campus?year=${selectedYear}&campus=${selectedCampus}&aggregate=${selectedYear === 'All' ? 'yearly' : 'monthly'}_total`);
            const buildingPromise = selectedCampus !== 'All' 
                ? fetchApi<BuildingApiResponse>(`/emissions/building?year=${selectedYear}&campus=${selectedCampus}`) 
                : Promise.resolve({ buildings: {} } as BuildingApiResponse);
            
            const [campusRes, deviceRes, trendRes, buildingRes] = await Promise.all([campusPromise, devicePromise, trendPromise, buildingPromise]);

            const campusData = Object.entries(campusRes.total_emissions || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
            setCampusChartData(campusData);
            
            let currentTotal = 0;
            if (selectedCampus === 'All') {
                currentTotal = campusData.reduce((sum, item) => sum + item.value, 0);
            } else {
                currentTotal = campusRes.total_emissions?.[selectedCampus] || 0;
            }
            setTotalEmissions(currentTotal);
            
            const deviceData = Object.entries(deviceRes.device_emissions || {}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
            const topDevices = deviceData.slice(0, 6);
            const otherValue = deviceData.slice(6).reduce((sum, item) => sum + item.value, 0);
            if (otherValue > 0) topDevices.push({ name: "Others", value: otherValue });
            setDevicePieData(topDevices);

            const aggTrend: { [time: string]: number } = {};
            Object.values(trendRes.emissions || {}).forEach(data => {
                Object.entries(data).forEach(([time, value]) => { 
                    aggTrend[time] = (aggTrend[time] || 0) + value; 
                });
            });
            const isAllYears = selectedYear === 'All';
            const formattedTrend = Object.entries(aggTrend).map(([time, total]) => ({ name: isAllYears ? time : monthLabels[parseInt(time)] || time, total })).sort((a, b) => parseInt(a.name.replace(/\D/g, '0')) - parseInt(b.name.replace(/\D/g, '0')));
            setTrendData(formattedTrend);
            
            const buildings = buildingRes.buildings || {};
            const buildingData = Object.entries(buildings).map(([name, data]) => ({ name, value: data.total_emission })).sort((a,b) => b.value - a.value);
            setBuildingChartData(buildingData);
            setAllBuildingsData(buildings);

            if (selectedCampus === 'All') {
                setTopEmitterName(campusData.length > 0 ? campusData[0].name : "N/A");
            } else {
                setTopEmitterName(buildingData.length > 0 ? buildingData[0].name : "N/A");
            }

        } catch (err: any) { setError(err.message); } 
        finally { setIsLoading(false); }
    };
    fetchDashboardData();
  }, [selectedYear, selectedCampus, fetchApi]);
  
  useEffect(() => {
      if (selectedBuilding && allBuildingsData) {
          const rooms = allBuildingsData[selectedBuilding]?.rooms || {};
          const roomData = Object.entries(rooms).map(([name, value]) => ({name, value})).sort((a,b) => b.value - a.value);
          setRoomChartData(roomData);
      } else {
          setRoomChartData([]);
      }
  }, [selectedBuilding, allBuildingsData]);

  const averageMonthlyEmission = selectedYear !== 'All' && totalEmissions ? totalEmissions / 12 : null;

  return (
    <>
      <Head>
        <title>Dashboard | ITB Carbon Emissions</title>
      </Head>
      <Layout>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Carbon Emissions Dashboard</h1>
                <p className="mt-1 text-sm text-slate-600">An overview of ITB's carbon footprint.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select value={selectedCampus} onChange={(e) => setSelectedCampus(e.target.value)} className="w-full sm:w-40 appearance-none text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg shadow-sm" disabled={isLoading}>
                    {availableCampuses.map(campus => <option key={campus} value={campus}>{campus === 'All' ? 'All Campuses' : campus}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full sm:w-40 appearance-none text-sm pl-3 pr-8 py-2 border border-slate-300 rounded-lg shadow-sm" disabled={isLoading}>
                    {availableYears.map(year => <option key={year} value={year}>{year === 'All' ? 'All Years' : year}</option>)}
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <DashboardCard title={`Total Emissions (${selectedCampus}, ${selectedYear})`} value={totalEmissions ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>} isLoading={isLoading} />
            <DashboardCard title={`Top Emitter (${selectedCampus})`} value={topEmitterName ?? 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H5a1 1 0 110-2V4zm3 1h2v1H7V5zm0 2h2v1H7V7zm0 2h2v1H7V9zm0 2h2v1H7v-1zm4-6h2v1h-2V5zm0 2h2v1h-2V7zm0 2h2v1h-2V9zm0 2h2v1h-2v-1z" clipRule="evenodd" /></svg>} isLoading={isLoading} />
            <DashboardCard title={`Avg. Monthly (${selectedYear})`} value={averageMonthlyEmission ?? '-'} unit="kg CO₂e" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>} isLoading={isLoading || selectedYear === 'All'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title={`Emissions Trend (${selectedCampus}, ${selectedYear})`} isLoading={isLoading} error={error} noZoom={true}>
              <ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} ><CartesianGrid strokeDasharray="3 3" stroke={slate[200]} /><XAxis dataKey="name" tick={{ fill: slate[500], fontSize: 11 }} /><YAxis tick={{ fill: slate[500], fontSize: 11 }} tickFormatter={(v) => formatNumber(v,0)} /><Tooltip content={<CustomTooltip />} /><Legend /><Line type="monotone" dataKey="total" name="Total Emissions" stroke={trendPalette[0]} strokeWidth={2.5} /></LineChart></ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title={`Emissions by Device Type (${selectedCampus})`} isLoading={isLoading} error={error}>
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 30, left: 0 }}>
                      <Pie data={devicePieData} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius="80%" labelLine={false} label={renderCustomizedPieLabel}>{devicePieData.map((_, index) => (<Cell key={`cell-dev-${index}`} fill={devicePiePalette[index % devicePiePalette.length]} />))}</Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '15px' }}/>
                  </PieChart>
              </ResponsiveContainer>
          </ChartContainer>

          {selectedCampus === 'All' ? (
              <ChartContainer title={`Top Emitters by Campus (${selectedYear})`} isLoading={isLoading} error={error}>
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={campusChartData} layout="vertical" margin={{ top: 5, right: 30, left: -30, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={slate[200]} horizontal={false} /><XAxis type="number" tick={{ fill: slate[500], fontSize: 11 }} tickFormatter={(v) => formatNumber(v,0)} /><YAxis type="category" dataKey="name" width={220} tick={<CustomYAxisTick />} interval={0} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>{campusChartData.map((_, index) => ( <Cell key={`cell-campus-${index}`} fill={comparisonPalette[index % comparisonPalette.length]} /> ))}</Bar></BarChart></ResponsiveContainer>
              </ChartContainer>
          ) : (
            <>
              <ChartContainer title={`Top Emitters by Building (${selectedCampus})`} isLoading={isLoading} error={error}>
                  <ResponsiveContainer width="100%" height="100%"><BarChart data={buildingChartData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: -30, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={slate[200]} horizontal={false} /><XAxis type="number" tick={{ fill: slate[500], fontSize: 11 }} tickFormatter={(v) => formatNumber(v,0)} /><YAxis type="category" dataKey="name" width={220} tick={<CustomYAxisTick />} interval={0} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>{buildingChartData.slice(0, 10).map((_, index) => ( <Cell key={`cell-bldg-${index}`} fill={comparisonPalette[index % comparisonPalette.length]} /> ))}</Bar></BarChart></ResponsiveContainer>
              </ChartContainer>
              <ChartContainer title={`Top Emitters by Room (${selectedBuilding || 'Select a Building'})`} isLoading={isLoading && !!selectedBuilding} error={error} actions={<select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} disabled={isLoading || buildingChartData.length === 0} className="w-48 text-xs p-1.5 border rounded-md"><option value="">Select Building</option>{allBuildingsData && Object.keys(allBuildingsData).sort().map(name => <option key={name} value={name}>{name}</option>)}</select>}>
                  {!selectedBuilding ? <div className="flex items-center justify-center h-full text-slate-500">Please select a building above.</div> : roomChartData.length > 0 ? <ResponsiveContainer width="100%" height="100%"><BarChart data={roomChartData.slice(0, 10)} layout="vertical" margin={{ top: 5, right: 30, left: -30, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke={slate[200]} horizontal={false} /><XAxis type="number" tick={{ fill: slate[500], fontSize: 11 }} tickFormatter={(v) => formatNumber(v,0)} /><YAxis type="category" dataKey="name" width={220} tick={<CustomYAxisTick />} interval={0} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="value" name="Emissions" radius={[0, 4, 4, 0]} barSize={16}>{roomChartData.slice(0, 10).map((_, index) => ( <Cell key={`cell-room-${index}`} fill={comparisonPalette[index % comparisonPalette.length]} /> ))}</Bar></BarChart></ResponsiveContainer> : <div className="flex items-center justify-center h-full text-slate-500">No room data available.</div>}
              </ChartContainer>
            </>
          )}
        </div>
        {modalConfig && <ChartModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} {...modalConfig} />}
      </Layout>
    </>
  );
};

export default Dashboard;