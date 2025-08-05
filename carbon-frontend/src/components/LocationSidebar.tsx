"use client";

import React, { useEffect, useState, ReactNode } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend, TooltipProps } from "recharts";

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
interface ListItem { name: string; value: number; }

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const PIE_CHART_COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#F97316', '#F59E0B', '#10B981', '#64748B'];

const formatNumber = (num: number | null | undefined, dec = 2): string => {
  if (num === null || num === undefined || isNaN(num)) return "-";
  return num.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
};

const formatYAxis = (tickItem: number) => {
    if (tickItem >= 1000000) return `${(tickItem / 1000000).toFixed(1)}M`;
    if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(0)}k`;
    return tickItem.toString();
};

const monthLabels: { [key: number]: string } = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" };

const Skeleton: React.FC<{ className?: string }> = ({ className }) => <div className={`bg-slate-200 rounded animate-pulse ${className}`}></div>;

const ComparisonPill: React.FC<{ change: number | null }> = ({ change }) => {
    if (change === null || !isFinite(change) || change === 0) return null;
    const isNegative = change < 0;
    return (
        <span className={`text-xs font-bold ml-2 px-2 py-0.5 rounded-full flex-shrink-0 ${isNegative ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isNegative ? '▼' : '▲'} {Math.abs(change).toFixed(1)}%
        </span>
    );
};

const StatCard: React.FC<{ title: string; value: string; isLoading: boolean; subtitle?: string; children?: ReactNode; variant?: 'default' | 'primary' }> = 
({ title, value, isLoading, subtitle, children, variant = 'default' }) => {
    const baseClasses = "p-3 rounded-md border min-w-0";
    const variantClasses = variant === 'primary' 
        ? "bg-blue-50 border-blue-200/90" 
        : "bg-white border-slate-200/90";
    const titleColor = variant === 'primary' ? 'text-blue-700' : 'text-slate-500';
    const valueColor = variant === 'primary' ? 'text-blue-900' : 'text-slate-800';

    return (
        <div className={`${baseClasses} ${variantClasses}`}>
            <p className={`text-xs font-medium uppercase ${titleColor}`}>{title}</p>
            <div className={`text-xl font-bold mt-1 flex items-center ${valueColor}`}>
                {isLoading ? <Skeleton className="h-7 w-3/4" /> : (
                    <>
                        <span className="truncate">{value}</span>
                        {children}
                    </>
                )}
            </div>
            {subtitle && !isLoading && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    );
};

const ExpandableDataTable: React.FC<{ title: string; items: ListItem[]; headers: [string, string, string]; isLoading: boolean; defaultVisible?: number; children?: ReactNode }> = 
({ title, items, headers, isLoading, defaultVisible = 5, children }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const visibleItems = isExpanded ? items : items.slice(0, defaultVisible);

    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">{title}</h3>
            {children}
            {isLoading ? <div className="space-y-2 mt-2"><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/><Skeleton className="h-10 w-full"/></div> : items.length > 0 ? (
                <>
                    <div className="bg-white border border-slate-200/60 rounded-md overflow-hidden">
                        <table className="w-full text-sm table-fixed">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="p-2.5 text-left text-xs font-semibold text-slate-500 uppercase w-10">{headers[0]}</th>
                                    <th className="p-2.5 text-left text-xs font-semibold text-slate-500 uppercase">{headers[1]}</th>
                                    <th className="p-2.5 text-right text-xs font-semibold text-slate-500 uppercase w-32">{headers[2]}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleItems.map((item, index) => (
                                    <tr key={item.name} className="border-t border-slate-200/80">
                                        <td className="p-2.5 text-center text-slate-500">{index + 1}</td>
                                        <td className="p-2.5 text-slate-700 truncate" title={item.name}>{item.name}</td>
                                        <td className="p-2.5 text-right font-medium text-slate-800 whitespace-nowrap">{formatNumber(item.value, 2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {items.length > defaultVisible && (
                        <button onClick={() => setIsExpanded(!isExpanded)} className="text-xs font-semibold text-blue-600 hover:text-blue-800 mt-2">
                            {isExpanded ? 'View Less' : `View More (${items.length - defaultVisible} more)`}
                        </button>
                    )}
                </>
            ) : <p className="text-xs text-center text-slate-500 py-3 bg-white border border-slate-200/60 rounded-md">No data available.</p>}
        </div>
    );
};

const MiniTrendChart: React.FC<{ data: any[] }> = ({ data }) => (
    <div className="h-48 w-full bg-white p-2 rounded-md border border-slate-200/90">
        <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={formatYAxis} />
                <Tooltip 
                    contentStyle={{ fontSize: '12px', borderRadius: '0.5rem', padding: '8px' }}
                    formatter={(value: number) => [`${formatNumber(value, 2)} kg CO₂e`, "Emissions"]}
                />
                <Line type="monotone" dataKey="total" name="Emissions" stroke="#3B82F6" strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 2 }} />
            </LineChart>
        </ResponsiveContainer>
    </div>
);

const renderCustomizedPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

const DevicePieChart: React.FC<{ title: string, items: ListItem[], isLoading: boolean }> = ({ title, items, isLoading }) => {
    const TOP_N_DEVICES = 7;
    const chartData = [...items];
    let othersValue = 0;
    if (chartData.length > TOP_N_DEVICES) {
        othersValue = chartData.slice(TOP_N_DEVICES).reduce((sum, item) => sum + item.value, 0);
        chartData.splice(TOP_N_DEVICES);
        if(othersValue > 0) chartData.push({ name: 'Lainnya', value: othersValue });
    }

    const CustomPieTooltip = ({ active, payload }: TooltipProps<number, string>) => {
        if (!active || !payload || !payload.length) return null;
        return (
            <div className="bg-white/90 p-2 rounded-lg shadow-md border border-slate-200 text-xs backdrop-blur-sm">
                <p className="font-semibold text-slate-700 mb-1">{payload[0].name}</p>
                <p className="text-slate-600">Emissions: <span className="font-bold text-slate-800">{formatNumber(payload[0].value as number, 2)} kg CO₂e</span></p>
            </div>
        );
    };

    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-600 mb-2">{title}</h3>
            {isLoading ? <Skeleton className="h-64 w-full rounded-md"/> : items.length > 0 ? (
                <div className="h-64 w-full bg-white p-2 rounded-md border border-slate-200/90">
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" labelLine={false} label={renderCustomizedPieLabel} >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend iconSize={8} wrapperStyle={{fontSize: "11px", lineHeight: "1.2"}}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : <p className="text-xs text-center text-slate-500 py-3 bg-white border border-slate-200/60 rounded-md">No data available.</p>}
        </div>
    );
};

const DashboardView: React.FC<{ selectedYear: string }> = ({ selectedYear }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<{ total: number | null; prevTotal: number | null; trend: any[]; devices: ListItem[]; campuses: ListItem[] }>({ total: null, prevTotal: null, trend: [], devices: [], campuses: [] });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const prevYear = selectedYear !== 'All' ? String(Number(selectedYear) - 1) : 'All';
            try {
                const [campusRes, devRes, trendRes, campusPrevRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/emissions/campus?year=${selectedYear}&aggregate=total`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/emissions/device?year=${selectedYear}`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/emissions/campus?year=${selectedYear}&aggregate=${selectedYear === 'All' ? 'yearly' : 'monthly'}_total`).then(res => res.json()),
                    fetch(`${API_BASE_URL}/emissions/campus?year=${prevYear}&aggregate=total`).then(res => res.json())
                ]);

                const campusList = Object.entries(campusRes.total_emissions as {[k:string]:number}).map(([name, value]) => ({ name: `${name} Campus`, value })).sort((a, b) => b.value - a.value);
                const devList = devRes.device_emissions ? Object.entries(devRes.device_emissions as {[k:string]:number}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value) : [];
                const total = campusList.reduce((s, i) => s + i.value, 0);
                const prevTotal = Object.values(campusPrevRes.total_emissions as {[k:string]:number}).reduce((s, v) => s + v, 0);

                const aggTrend: { [k: string]: number } = {};
                Object.values(trendRes.emissions as {[k:string]:{[k:string]:number}}).forEach(d => Object.entries(d).forEach(([t,v]) => { aggTrend[t] = (aggTrend[t] || 0) + v; }));
                const isAllYears = selectedYear === 'All';
                const trendData = Object.entries(aggTrend).map(([time, total]) => ({ name: isAllYears ? time : monthLabels[parseInt(time)] || time, total })).sort((a,b) => {
                    const timeA = isAllYears ? parseInt(a.name) : Object.keys(monthLabels).find(key => monthLabels[parseInt(key)] === a.name) || 0;
                    const timeB = isAllYears ? parseInt(b.name) : Object.keys(monthLabels).find(key => monthLabels[parseInt(key)] === b.name) || 0;
                    return Number(timeA) - Number(timeB);
                });
                
                setData({ total, prevTotal, trend: trendData, devices: devList, campuses: campusList });
            } catch (err) { console.error(err); } 
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [selectedYear]);

    const percentageChange = (data.total && data.prevTotal) ? ((data.total - data.prevTotal) / data.prevTotal) * 100 : null;
    const comparisonSubtitle = selectedYear !== 'All' ? `vs ${Number(selectedYear) - 1}` : 'vs Previous Period';
    
    return (
        <div className="p-4 space-y-5">
            <StatCard 
                title="Total Emissions" 
                value={`${formatNumber(data.total, 2)} kg CO₂e`} 
                isLoading={isLoading}
                subtitle={comparisonSubtitle}
                variant="primary"
            >
                <ComparisonPill change={percentageChange} />
            </StatCard>
             <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Emissions Trend</h3>
                {isLoading ? <Skeleton className="h-52 w-full"/> : <MiniTrendChart data={data.trend} />}
            </div>
            <ExpandableDataTable title="Emissions by Campus" items={data.campuses} headers={['#', 'Campus', 'Emissions (kg CO₂e)']} isLoading={isLoading} defaultVisible={4} />
            <DevicePieChart title="Emissions by Device Type" items={data.devices} isLoading={isLoading} />
        </div>
    );
};

const CampusView: React.FC<Omit<LocationSidebarProps, 'isOpen' | 'onReturnToOverview'>> = (props) => {
    const { buildings, isLoading, campusTotalEmission, campusTotalEmissionPrevYear, location, selectedYear } = props;
    const [rooms, setRooms] = useState<ListItem[]>([]);
    const [selectedBuilding, setSelectedBuilding] = useState<string>("");
    const [deviceData, setDeviceData] = useState<ListItem[]>([]);
    const [isDeviceLoading, setIsDeviceLoading] = useState(true);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [isTrendLoading, setIsTrendLoading] = useState(true);

    useEffect(() => { 
        setSelectedBuilding(""); 
        setRooms([]); 
    }, [location]);
    
    useEffect(() => {
        if (!location || location.id === 'All') return;
        
        const fetchDeviceData = async () => {
            setIsDeviceLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/emissions/device?campus=${location.id}&year=${selectedYear}`).then(r => r.json());
                const devList = res.device_emissions ? Object.entries(res.device_emissions as {[k:string]:number}).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value) : [];
                setDeviceData(devList);
            } catch (err) { console.error("Failed to fetch device data for campus:", err); setDeviceData([]); } 
            finally { setIsDeviceLoading(false); }
        };

        const fetchTrendData = async () => {
            setIsTrendLoading(true);
            const isAllYears = selectedYear === 'All';
            const aggregate = isAllYears ? 'yearly_total' : 'monthly_total';
            try {
                const res = await fetch(`${API_BASE_URL}/emissions/campus?campus=${location.id}&year=${selectedYear}&aggregate=${aggregate}`).then(r => r.json());
                const campusTrendData = res.emissions?.[location.id as string] || {};
                const formattedTrend = Object.entries(campusTrendData).map(([time, total]) => ({
                    name: isAllYears ? time : monthLabels[parseInt(time)] || time,
                    total
                })).sort((a,b) => {
                    const timeA = isAllYears ? parseInt(a.name) : Object.keys(monthLabels).find(key => monthLabels[parseInt(key)] === a.name) || 0;
                    const timeB = isAllYears ? parseInt(b.name) : Object.keys(monthLabels).find(key => monthLabels[parseInt(key)] === b.name) || 0;
                    return Number(timeA) - Number(timeB);
                });
                setTrendData(formattedTrend);
            } catch (err) { console.error("Failed to fetch trend data for campus:", err); setTrendData([]); }
            finally { setIsTrendLoading(false); }
        };

        fetchDeviceData();
        fetchTrendData();

    }, [location, selectedYear]);

    useEffect(() => {
        if (!selectedBuilding) { setRooms([]); return; }
        const building = buildings.find(b => b.name === selectedBuilding);
        if (building && building.rooms) {
            const roomList = Object.entries(building.rooms).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
            setRooms(roomList);
        } else {
            setRooms([]);
        }
    }, [selectedBuilding, buildings]);
    
    const percentageChange = (campusTotalEmission && campusTotalEmissionPrevYear) ? ((campusTotalEmission - campusTotalEmissionPrevYear) / campusTotalEmissionPrevYear) * 100 : null;
    const comparisonSubtitle = selectedYear !== 'All' ? `vs ${Number(selectedYear) - 1}` : 'vs Previous Period';

    return (
        <div className="p-4 space-y-5">
            <div className="space-y-3">
                <StatCard 
                    title="Total Emissions" 
                    value={`${formatNumber(campusTotalEmission, 2)} kg CO₂e`} 
                    isLoading={isLoading}
                    subtitle={comparisonSubtitle}
                    variant="primary"
                >
                    <ComparisonPill change={percentageChange} />
                </StatCard>
                <StatCard title="Buildings Tracked" value={isLoading ? "-" : String(buildings.length)} isLoading={isLoading} />
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-2">Emissions Trend</h3>
                {isTrendLoading ? <Skeleton className="h-52 w-full"/> : <MiniTrendChart data={trendData} />}
            </div>
            <ExpandableDataTable
                title="Top Emitting Buildings"
                items={buildings.map(b => ({ name: b.name, value: b.total_emission }))}
                headers={['#', 'Building', 'Emissions (kg CO₂e)']}
                isLoading={isLoading}
            />
            <ExpandableDataTable
                title="Top Emitting Rooms"
                items={rooms}
                headers={['#', 'Room', 'Emissions (kg CO₂e)']}
                isLoading={false}
            >
                <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} disabled={isLoading || buildings.length === 0} className="w-full text-sm p-2 mb-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                    <option value="">-- Select Building --</option>
                    {buildings.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
            </ExpandableDataTable>
            <DevicePieChart title="Emissions by Device Type" items={deviceData} isLoading={isDeviceLoading} />
        </div>
    );
};

interface LocationSidebarProps {
    isOpen: boolean;
    onReturnToOverview: () => void;
    location: LocationData | null;
    buildings: BuildingData[];
    isLoading: boolean;
    error: string | null;
    selectedYear: string;
    availableYears: string[];
    onYearChange: (newYear: string) => void;
    campusTotalEmission: number | null;
    campusTotalEmissionPrevYear: number | null;
}

export default function LocationSidebar(props: LocationSidebarProps) {
    const { isOpen, onReturnToOverview, location, selectedYear, onYearChange, availableYears } = props;
    if (!isOpen || !location) return null;
    const isDashboardView = location.id === 'All';

    return (
        <div className="absolute top-0 left-0 h-full w-[90vw] max-w-md bg-slate-100 z-20 flex flex-col shadow-lg">
            <div className="p-4 bg-white border-b border-slate-200 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        {!isDashboardView && (
                            <button onClick={onReturnToOverview} className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 flex-shrink-0" title="Back to Overview">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </button>
                        )}
                        <h2 className="text-lg font-bold text-slate-800 truncate">{location.name}</h2>
                    </div>
                    {isDashboardView && (
                        <Link href="/carbon-dashboard" passHref legacyBehavior>
                            <a className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors" title="View Full Dashboard Page">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </a>
                        </Link>
                    )}
                </div>
                <p className="text-xs text-slate-500 mt-1 ml-1">{selectedYear === "All" ? "All time data" : `Data for ${selectedYear}`}</p>
                <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)} className="w-full text-sm mt-3 p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                    {availableYears.map(year => (<option key={year} value={year}>{year === "All" ? "All Time" : year}</option>))}
                </select>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
                {isDashboardView ? <DashboardView selectedYear={selectedYear} /> : <CampusView {...props} />}
            </div>
        </div>
    );
}