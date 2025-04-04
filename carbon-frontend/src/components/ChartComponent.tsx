"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState } from "react";

const campuses = [
  "Ganesha",
  "Jatinangor",
  "Cirebon",
  "Jakarta",
  "Observatorium Bosscha",
];

const bluePalette = ["#DBEAFE", "#93C5FD", "#60A5FA", "#3B82F6", "#1D4ED8"];

const yearlyCampusData = [
  { year: 2021, Ganesha: 5000, Jatinangor: 4200, Cirebon: 3000, Jakarta: 2700, "Observatorium Bosscha": 1800 },
  { year: 2022, Ganesha: 5300, Jatinangor: 4500, Cirebon: 3200, Jakarta: 2800, "Observatorium Bosscha": 1900 },
  { year: 2023, Ganesha: 5500, Jatinangor: 4700, Cirebon: 3400, Jakarta: 2900, "Observatorium Bosscha": 2000 },
  { year: 2024, Ganesha: 5700, Jatinangor: 4900, Cirebon: 3600, Jakarta: 3000, "Observatorium Bosscha": 2100 },
];

const monthlyByCampus = {
  2024: [
    { month: "Jan", Ganesha: 450, Jatinangor: 370, Cirebon: 280, Jakarta: 230, "Observatorium Bosscha": 160 },
    { month: "Feb", Ganesha: 460, Jatinangor: 380, Cirebon: 290, Jakarta: 240, "Observatorium Bosscha": 170 },
  ]
};

const buildingData = {
  Ganesha: [
    { name: "Lab Elektro", value: 500 },
    { name: "CC Barat", value: 400 },
    { name: "CC Timur", value: 350 },
    { name: "Lab Fisika", value: 300 },
    { name: "Ruang Rapat Rektorat", value: 150 },
  ],
};

const roomData = {
  "Lab Elektro": [
    { name: "Ruang Server", value: 200 },
    { name: "Workshop", value: 150 },
    { name: "Kantor Dosen", value: 150 },
  ],
  "CC Barat": [
    { name: "Ruang Kelas 1", value: 180 },
    { name: "Ruang Kelas 2", value: 220 },
  ],
};

export default function ChartComponent() {
  const [viewMode, setViewMode] = useState("yearly");
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedCampus, setSelectedCampus] = useState("Ganesha");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("All");

  const handleBarClick = (payload) => {
    if (viewMode === "yearly") {
      setSelectedYear(payload.year);
      setViewMode("monthly");
    }
  };

  const goBack = () => {
    setViewMode("yearly");
    setSelectedYear(null);
    setSelectedBuilding(null);
  };

  const chartData =
    viewMode === "yearly"
      ? yearlyCampusData
      : selectedYear
      ? monthlyByCampus[selectedYear]
      : [];

  const pieData = selectedBuilding
    ? roomData[selectedBuilding] || []
    : buildingData[selectedCampus] || [];

  const pieTitle = selectedBuilding
    ? `Emissions by Room in ${selectedBuilding}`
    : `Total Emissions by Building in ${selectedCampus} (${selectedYear})`;

  return (
    <>
      {/* BAR CHART */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-blue-700">
            {viewMode === "yearly"
              ? "Annual Emissions by Campus (2021–2024)"
              : `Monthly Emissions for ${selectedYear}`}
          </h3>
          {viewMode === "monthly" && (
            <button onClick={goBack} className="text-sm text-blue-600 hover:underline">
              ← Back to Yearly
            </button>
          )}
        </div>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              onClick={({ activePayload }) => {
                if (viewMode === "yearly" && activePayload?.[0]?.payload) {
                  handleBarClick(activePayload[0].payload);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={viewMode === "yearly" ? "year" : "month"} />
              <YAxis />
              <Tooltip />
              <Legend />
              {campuses.map((campus, idx) => (
                <Bar
                  key={campus}
                  dataKey={campus}
                  stackId="a"
                  fill={bluePalette[idx % bluePalette.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FILTERS BELOW CHART */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Campus</label>
          <select
            value={selectedCampus}
            onChange={(e) => {
              setSelectedCampus(e.target.value);
              setSelectedBuilding(null);
            }}
            className="mt-1 border border-gray-300 rounded px-3 py-1"
          >
            {campuses.map((campus) => (
              <option key={campus} value={campus}>
                {campus}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="mt-1 border border-gray-300 rounded px-3 py-1"
          >
            {[2021, 2022, 2023, 2024].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-1 border border-gray-300 rounded px-3 py-1"
          >
            <option value="All">All</option>
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PIE CHART */}
      <div className="bg-white p-6 rounded shadow mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-blue-700">
            {pieTitle}
          </h3>
          {selectedBuilding && (
            <button onClick={() => setSelectedBuilding(null)} className="text-sm text-blue-600 hover:underline">
              ← Back to Buildings
            </button>
          )}
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name }) => name}
                onClick={(data) => {
                  if (!selectedBuilding) setSelectedBuilding(data.name);
                }}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={bluePalette[index % bluePalette.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
 