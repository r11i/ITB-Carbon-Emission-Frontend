"use client";

import ChartComponent from "@/components/ChartComponent";

export default function CarbonEmissionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-8">
      {/* Header Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-sm text-gray-500 mb-1">Total Emissions</h3>
        <p className="text-3xl font-bold text-blue-600">3,403,293t CO₂e</p>
        <p className="text-sm text-blue-500">⬅ 5% Lower to previous year</p>
      </div>
        <div className="bg-white p-6 rounded shadow col-span-2 grid grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm text-gray-500">Scope 1 - Direct Emissions</h4>
            <p className="text-xl font-semibold text-gray-600">359,942t CO₂e</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500">Scope 2 - Indirect Emissions</h4>
            <p className="text-xl font-semibold text-gray-600">499,923t CO₂e</p>
          </div>
          <div>
            <h4 className="text-sm text-gray-500">Scope 3 - Other Indirect</h4>
            <p className="text-xl font-semibold text-gray-600">2,359,942t CO₂e</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <ChartComponent />
    </div>
  );
}
