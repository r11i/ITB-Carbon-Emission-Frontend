"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DeviceInputPage() {
  const [formData, setFormData] = useState({
    deviceName: "",
    power: "",
    campus: "",
    building: "",
    room: "",
    usageTime: "",
  });

  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const buildingOptions: Record<string, string[]> = {
    "ITB Ganesha": ["Gedung A", "Gedung B"],
    "ITB Jatinangor": ["Gedung X", "Gedung Y"],
    "ITB Jakarta": ["Gedung J1", "Gedung J2"],
    "ITB Cirebon": ["Gedung C1"],
    "Observatorium Bosscha": ["Gedung Observasi"],
  };

  const roomOptions: Record<string, string[]> = {
    "Gedung A": ["Ruang 101", "Ruang 102"],
    "Gedung B": ["Ruang B1"],
    "Gedung X": ["Lab Fisika"],
    "Gedung Y": ["Studio Desain"],
    "Gedung J1": ["Ruang Jakarta"],
    "Gedung C1": ["Ruang Cirebon"],
    "Gedung Observasi": ["Ruang Teleskop"],
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (e.target.name === "campus") {
      setFormData((prev) => ({
        ...prev,
        building: "",
        room: "",
      }));
    }

    if (e.target.name === "building") {
      setFormData((prev) => ({
        ...prev,
        room: "",
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      // Simulasikan ID ruangan
      const room_id = `${formData.campus}-${formData.building}-${formData.room}`;

      // 1. Tambah perangkat ke Supabase
      const res1 = await fetch("http://localhost:5000/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_name: formData.deviceName,
          device_power: parseInt(formData.power),
          room_id,
        }),
      });

      const deviceResponse = await res1.json();
      if (!res1.ok) throw new Error(deviceResponse.error);

      const device_id = deviceResponse.device[0].device_id;

      // 2. Simpan data penggunaan perangkat
      const selectedYear = selectedMonth?.getFullYear();
      const selectedMonthValue = selectedMonth ? selectedMonth.getMonth() + 1 : 1;

      const res2 = await fetch("http://localhost:5000/device_usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id,
          usage_hours: parseInt(formData.usageTime),
          year: selectedYear,
          month: selectedMonthValue,
        }),
      });

      const usageResponse = await res2.json();
      if (!res2.ok) throw new Error(usageResponse.error);

      alert("✅ Data berhasil disimpan ke server!");
    } catch (err: any) {
      alert("❌ Gagal menyimpan data: " + err.message);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-100 flex flex-col items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Form Input Data Perangkat
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Nama Perangkat</label>
            <input
              type="text"
              name="deviceName"
              value={formData.deviceName}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Daya Perangkat (Watt)</label>
            <input
              type="number"
              name="power"
              value={formData.power}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-800"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-1">Bulan & Tahun</label>
            <DatePicker
              selected={selectedMonth}
              onChange={(date) => setSelectedMonth(date)}
              dateFormat="MM/yyyy"
              showMonthYearPicker
              placeholderText="Pilih Bulan dan Tahun"
              className="w-full border p-2 rounded text-gray-800"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Kampus</label>
            <select
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-800"
            >
              <option value="">Pilih Kampus</option>
              {Object.keys(buildingOptions).map((campus) => (
                <option key={campus} value={campus}>
                  {campus}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Gedung</label>
            <select
              name="building"
              value={formData.building}
              onChange={handleChange}
              disabled={!formData.campus}
              className="w-full border p-2 rounded text-gray-800"
            >
              <option value="">Pilih Gedung</option>
              {formData.campus &&
                buildingOptions[formData.campus]?.map((building) => (
                  <option key={building} value={building}>
                    {building}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Ruangan</label>
            <select
              name="room"
              value={formData.room}
              onChange={handleChange}
              disabled={!formData.building}
              className="w-full border p-2 rounded text-gray-800"
            >
              <option value="">Pilih Ruangan</option>
              {formData.building &&
                roomOptions[formData.building]?.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Lama Pemakaian (jam)</label>
            <input
              type="number"
              name="usageTime"
              value={formData.usageTime}
              onChange={handleChange}
              className="w-full border p-2 rounded text-gray-800"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Simpan Data
        </button>
      </div>
    </div>
  );
}
