"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GANESHA_CAMPUS_API_NAME = "Ganesha";

export default function UpdateDeviceUsagePage() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [deviceOptions, setDeviceOptions] = useState<{ device_id: number; device_name: string }[]>([]);
  const [usageOptions, setUsageOptions] = useState<{ usage_id: number; year: number; month: number; usage_hours: number }[]>([]);

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<number | null>(null);
  const [selectedUsageId, setSelectedUsageId] = useState<number | null>(null);
  const [newUsageHours, setNewUsageHours] = useState<number>(0);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      logout();
      router.push("/login?sessionExpired=true");
      throw new Error("Unauthorized");
    }
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401 || res.status === 403) {
      logout();
      router.push("/login?sessionExpired=true");
      throw new Error("Unauthorized");
    }
    return res;
  }, [logout, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWithAuth(`${API_BASE_URL}/buildings?campus_name=${GANESHA_CAMPUS_API_NAME}`)
        .then(res => res.json())
        .then(data => setBuildingOptions(data.buildings))
        .catch(() => setError("Failed to load buildings"));
    }
  }, [isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchWithAuth(`${API_BASE_URL}/rooms?building_name=${encodeURIComponent(selectedBuilding)}`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data.rooms)) throw new Error("Invalid room data");
          const roomNames = data.rooms.map((room: any) => room.room_name);
          setRoomOptions(roomNames);
        })
        .catch(() => setError("Failed to load rooms"));
    }
  }, [selectedBuilding, fetchWithAuth]);


  useEffect(() => {
    if (selectedRoom) {
      fetchWithAuth(`${API_BASE_URL}/devices?room_name=${selectedRoom}`)
        .then(res => res.json())
        .then(data => setDeviceOptions(data.devices))
        .catch(() => setError("Failed to load devices"));
    }
  }, [selectedRoom, fetchWithAuth]);

  useEffect(() => {
    if (selectedDevice) {
      fetchWithAuth(`${API_BASE_URL}/emissions/device_usage?device_id=${selectedDevice}`)
        .then(res => res.json())
        .then(data => setUsageOptions(data.usage_records))
        .catch(() => setError("Failed to load usage data"));
    }
  }, [selectedDevice, fetchWithAuth]);

  const handleUpdate = async () => {
    if (!selectedUsageId || !selectedDevice) return;
    try {
      const selectedRecord = usageOptions.find(u => u.usage_id === selectedUsageId);
      const res = await fetchWithAuth(`${API_BASE_URL}/emissions/device_usage/update`, {
        method: "PUT",
        body: JSON.stringify({
          usage_id: selectedUsageId,
          device_id: selectedDevice,
          year: selectedRecord?.year,
          month: selectedRecord?.month,
          usage_hours: newUsageHours,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isAuthLoading) return <div>Loading authentication...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return (
    <Layout title="Update Device Usage" subtitle="Select and update device usage records">
      <div className="space-y-4 max-w-3xl mx-auto">
        {error && <div className="text-red-500">{error}</div>}
        {message && <div className="text-green-500">{message}</div>}

        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Building</option>
          {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Room</option>
          {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <select value={selectedDevice || ""} onChange={e => setSelectedDevice(Number(e.target.value))} className="w-full p-2 border rounded">
          <option value="">Select Device</option>
          {deviceOptions.map(d => <option key={d.device_id} value={d.device_id}>{`${d.device_name} (${d.device_power}W)`}</option>)}
        </select>

        <select value={selectedUsageId || ""} onChange={e => setSelectedUsageId(Number(e.target.value))} className="w-full p-2 border rounded">
          <option value="">Select Usage Record</option>
          {usageOptions.map(u => <option key={u.usage_id} value={u.usage_id}>{`${u.year}-${u.month.toString().padStart(2, "0")} (${u.usage_hours} hrs)`}</option>)}
        </select>

        <input type="number" value={newUsageHours} onChange={e => setNewUsageHours(Number(e.target.value))} placeholder="New Usage Hours" className="w-full p-2 border rounded" />

        <button onClick={handleUpdate} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Update Usage</button>
      </div>
    </Layout>
  );
}
