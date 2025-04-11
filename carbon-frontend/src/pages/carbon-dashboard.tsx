import { useEffect, useState } from "react";
import { useRouter } from "next/router"; // ✅ Import router
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const bluePalette = ["#DBEAFE", "#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8"];
const tealPalette = [
  "#626F47", "#A4B465", "#FFCF50", "#FEFAE0",
  "#D4A373", "#B7C9A8", "#E9EDC9", "#C9B458"
];

const renderLabel = ({ percent }: { percent: number }) => `${(percent * 100).toFixed(1)}%`;

const monthLabels = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const Dashboard = () => {
  const router = useRouter(); // ✅ Inisialisasi router

  const [data, setData] = useState<any[]>([]);
  const [campusData, setCampusData] = useState<any>({});
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<"year" | "month">("year");
  const [pieData, setPieData] = useState<any[]>([]);
  const [buildingData, setBuildingData] = useState<any[]>([]);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [currentBuilding, setCurrentBuilding] = useState<string | null>(null);
  const [totalEmissions, setTotalEmissions] = useState<number>(0);
  const [buildingJson, setBuildingJson] = useState<any>(null);

  useEffect(() => {
    fetchYearlyData();
    fetchPieData();
    fetchDeviceData();
  }, []);

  const fetchYearlyData = async () => {
    try {
      const res = await fetch("http://localhost:5000/emissions/campus");
      const json = await res.json();
      const emissions = json.emissions;
      const structured: any[] = [];
      let total = 0;

      Object.entries(emissions).forEach(([campus, values]: any) => {
        Object.entries(values).forEach(([year, emission]: any) => {
          let existing = structured.find((d) => d.year === year);
          if (!existing) {
            existing = { year };
            structured.push(existing);
          }
          existing[campus] = emission;
          total += emission;
        });
      });

      setCampusData(emissions);
      setData(structured);
      setTotalEmissions(total);
      setChartMode("year");
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const fetchMonthlyData = async (year: string) => {
    try {
      const res = await fetch(`http://localhost:5000/emissions/campus?year=${year}`);
      const json = await res.json();
      const emissions = json.emissions;
      const structured: any[] = [];

      Object.entries(emissions).forEach(([campus, months]: any) => {
        Object.entries(months).forEach(([month, emission]: any) => {
          let existing = structured.find((d) => d.month === month);
          if (!existing) {
            existing = { month };
            structured.push(existing);
          }
          existing[campus] = emission;
        });
      });

      setData(structured);
      setSelectedYear(year);
      setChartMode("month");
    } catch (err) {
      console.error("Failed to fetch monthly data", err);
    }
  };

  const fetchPieData = async () => {
    try {
      const res = await fetch("http://localhost:5000/emissions/campus");
      const json = await res.json();
      const emissions = json.emissions;
      const structured: any[] = [];

      Object.entries(emissions).forEach(([campus, yearly]: any) => {
        const total = Object.values(yearly).reduce(
          (acc: number, val) => acc + (val as number),
          0
        );
        structured.push({ name: campus, value: total });
      });

      setPieData(structured);
      setBuildingData([]);
      setRoomData([]);
    } catch (err) {
      console.error("Failed to fetch pie data", err);
    }
  };

  const fetchDeviceData = async () => {
    try {
      const res = await fetch("http://localhost:5000/emissions/device");
      const json = await res.json();

      if (!json.device_emissions) {
        setDeviceData([]);
        return;
      }

      const structured = Object.entries(json.device_emissions).map(
        ([name, value]: any) => ({ name, value })
      );
      setDeviceData(structured);
    } catch (err) {
      console.error("Failed to fetch device data", err);
      setDeviceData([]);
    }
  };

  const fetchBuildingPie = async (campus: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/emissions/building?campus=${encodeURIComponent(campus)}`
      );
      const json = await res.json();
      const structured = Object.entries(json.buildings).map(
        ([name, val]: any) => ({ name, value: val.total_emission })
      );
      setBuildingJson(json.buildings);
      setBuildingData(structured);
      setRoomData([]);
    } catch (err) {
      console.error("Failed to fetch building data", err);
    }
  };

  const fetchRoomData = (buildingName: string) => {
    if (!buildingJson || !buildingJson[buildingName]) return;
    const rooms = buildingJson[buildingName].rooms;
    const structured = Object.entries(rooms).map(([name, value]: any) => ({ name, value }));
    setRoomData(structured);
    setCurrentBuilding(buildingName);
  };

  const handleBackPie = () => {
    if (roomData.length > 0) {
      setRoomData([]);
      setCurrentBuilding(null);
    } else {
      setBuildingData([]);
      setBuildingJson(null);
    }
  };

  return (
    <div className="p-10 bg-white min-h-screen font-sans">
      {/* ✅ Navbar with router.push */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          ← Back to Home
        </button>
        <h1 className="text-lg font-bold text-gray-700">ITB Carbon Emissions Dashboard</h1>
        <div></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-blue-50 rounded-lg p-5 shadow">
          <div className="text-sm text-gray-500 font-bold">Total Emissions</div>
          <div className="text-2xl font-bold text-blue-800">
            {totalEmissions.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg CO2e
          </div>
        </div>
        <div className="md:col-span-2 bg-white border rounded-lg p-5 shadow">
          <h2 className="text-base font-bold text-gray-700 mb-2">Total Emissions by Year</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart
                data={data.map((d) => {
                const total = Object.entries(d)
                    .filter(([key]) => key !== "year" && key !== "month")
                    .reduce((sum, [, val]) => sum + val, 0);
                return { year: d.year, total };
                })}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
                <XAxis dataKey="year" />
                <YAxis
                domain={[0, 'auto']}
                tickCount={5}
                tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                formatter={(value: number) =>
                    `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO2e`
                }
                contentStyle={{ color: "#4B5563" }}
                itemStyle={{ color: "#4B5563" }}
                />
                <Legend formatter={(value: string) => (
                <span style={{ color: "#4B5563", fontWeight: 500 }}>{value}</span>
                )} />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot />
            </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow mb-10">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          {chartMode === "year"
            ? "Annual Emissions by Campus (2021–2024)"
            : `Monthly Emissions in ${selectedYear}`}
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            onClick={(e: any) => {
              if (chartMode === "year" && e && e.activePayload) {
                const year = e.activePayload[0].payload.year;
                if (year) fetchMonthlyData(year);
              }
            }}
          >
            <XAxis
              dataKey={chartMode === "year" ? "year" : "month"}
              tickFormatter={(value) => chartMode === "month" ? monthLabels[parseInt(value) - 1] : value}
            />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO2e`}
              labelFormatter={(label) =>
                chartMode === "month"
                  ? monthLabels[parseInt(label) - 1] || label
                  : label
              }
              contentStyle={{ color: "#4B5563" }}
              itemStyle={{ color: "#4B5563" }}
            />
            <Legend
              formatter={(value: string) => (
                <span style={{ color: "#4B5563", fontWeight: 500 }}>{value}</span>
              )}
            />
            {Object.keys(campusData).map((campus, index) => (
              <Bar
                key={campus}
                dataKey={campus}
                fill={bluePalette[index % bluePalette.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>

        {chartMode === "month" && (
          <button
            onClick={() => {
              setSelectedYear(null);
              fetchYearlyData();
            }}
            className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow"
          >
            ← Back to Annual View
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6 shadow hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-bold text-blue-700 mb-4">
            {roomData.length > 0
              ? `Breakdown by Room in ${currentBuilding}`
              : buildingData.length > 0
              ? "Breakdown by Building"
              : "Total Emissions by Campus"}
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={roomData.length > 0 ? roomData : buildingData.length > 0 ? buildingData : pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={renderLabel}
                onClick={(e: any) => {
                  if (buildingData.length > 0 && !roomData.length) fetchRoomData(e.name);
                  else if (!buildingData.length && !roomData.length) fetchBuildingPie(e.name);
                }}
              >
                {(roomData.length > 0 ? roomData : buildingData.length > 0 ? buildingData : pieData).map((_, index) => (
                  <Cell key={`cell-${index}`} fill={bluePalette[index % bluePalette.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO2e`}
                contentStyle={{ color: "#4B5563" }}
                itemStyle={{ color: "#4B5563" }}
              />
              <Legend
                formatter={(value: string) => (
                  <span style={{ color: "#4B5563", fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {(buildingData.length > 0 || roomData.length > 0) && (
            <button
              onClick={handleBackPie}
              className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded shadow"
            >
              ← Back {roomData.length > 0 ? "to Building" : "to Campus"} View
            </button>
          )}
        </div>

        <div className="bg-white border rounded-lg p-6 shadow hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-bold text-emerald-700 mb-4">Total Emissions by Device</h2>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={deviceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={renderLabel}
              >
                {deviceData.map((_, index) => (
                  <Cell key={`cell-device-${index}`} fill={tealPalette[index % tealPalette.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg CO2e`}
                contentStyle={{ color: "#4B5563" }}
                itemStyle={{ color: "#4B5563" }}
              />
              <Legend
                iconSize={12}
                formatter={(value: string) => (
                  <span style={{ color: "#4B5563", fontWeight: 500 }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
