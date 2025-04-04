"use client";

import { useEffect, useState } from "react";

interface DeviceData {
  deviceName: string;
  quantity: number;
  power: number;
  dailyUsage: number;
  monthlyConsumption: number;
  costPerKwh: number;
  monthlyCost: number;
  monthlySavings: number;
}

export default function DeviceTablePage() {
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);

  useEffect(() => {
    // Contoh dummy data, bisa diganti dengan data dari API atau localStorage
    const dummyData: DeviceData[] = [
      {
        deviceName: "LED Light Bulb",
        quantity: 50,
        power: 10,
        dailyUsage: 12,
        monthlyConsumption: 750,
        costPerKwh: 0.12,
        monthlyCost: 90,
        monthlySavings: 30,
      },
      {
        deviceName: "HVAC System",
        quantity: 2,
        power: 5000,
        dailyUsage: 12,
        monthlyConsumption: 3600,
        costPerKwh: 0.12,
        monthlyCost: 432,
        monthlySavings: 100,
      },
      {
        deviceName: "Desktop Computer",
        quantity: 30,
        power: 200,
        dailyUsage: 8,
        monthlyConsumption: 4800,
        costPerKwh: 0.12,
        monthlyCost: 2400,
        monthlySavings: 150,
      },
      {
        deviceName: "AC",
        quantity: 12,
        power: 16,
        dailyUsage: 18,
        monthlyConsumption: 750,
        costPerKwh: 0.12,
        monthlyCost: 90,
        monthlySavings: 180,
      },
      {
        deviceName: "Refrigerator",
        quantity: 50,
        power: 10,
        dailyUsage: 24,
        monthlyConsumption: 5800,
        costPerKwh: 0.12,
        monthlyCost: 576,
        monthlySavings: 195,
      },
    ];
    setDeviceData(dummyData);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white p-6 rounded shadow-md w-full overflow-x-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
          Laporan Konsumsi Energi Perangkat
        </h2>

        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4">Device Name</th>
              <th className="py-2 px-4">Quantity</th>
              <th className="py-2 px-4">Power Rating (W)</th>
              <th className="py-2 px-4">Daily Usage (Hrs)</th>
              <th className="py-2 px-4">Monthly Consumption (kWh)</th>
              <th className="py-2 px-4">Cost per kWh ($)</th>
              <th className="py-2 px-4">Monthly Cost ($)</th>
              <th className="py-2 px-4">Monthly Savings ($)</th>
            </tr>
          </thead>
          <tbody>
            {deviceData.map((device, index) => (
              <tr key={index} className="border-b hover:bg-gray-100">
                <td className="py-2 px-4">{device.deviceName}</td>
                <td className="py-2 px-4">{device.quantity}</td>
                <td className="py-2 px-4">{device.power}</td>
                <td className="py-2 px-4">{device.dailyUsage}</td>
                <td className="py-2 px-4">{device.monthlyConsumption}</td>
                <td className="py-2 px-4">${device.costPerKwh.toFixed(2)}</td>
                <td className="py-2 px-4">${device.monthlyCost.toFixed(2)}</td>
                <td className="py-2 px-4">${device.monthlySavings.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
