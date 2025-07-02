"use client";

import React, { useState, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GANESHA_CAMPUS_API_NAME = "Ganesha";

export default function AddDevicePage() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const router = useRouter();

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [roomMap, setRoomMap] = useState<Record<string, number>>({});
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [devicePower, setDevicePower] = useState("");

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
      fetchWithAuth(`${API_BASE_URL}/rooms?building_name=${selectedBuilding}`)
        .then(res => res.json())
        .then(data => {
          const map: Record<string, number> = {};
          const names: string[] = [];
          data.rooms.forEach((r: { room_name: string, room_id: number }) => {
            map[r.room_name] = r.room_id;
            names.push(r.room_name);
          });
          setRoomMap(map);
          setRoomOptions(names);
        })
        .catch(() => setError("Failed to load rooms"));
    }
  }, [selectedBuilding, fetchWithAuth]);

  const handleAddDevice = async () => {
    setMessage(null);
    setError(null);

    const room_id = roomMap[selectedRoomName];
    if (!deviceName.trim() || !devicePower.trim() || !room_id) {
      setError("All fields are required.");
      return;
    }

    const payload = {
      device_name: deviceName.trim(),
      device_power: parseInt(devicePower),
      room_id
    };

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/devices/add`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setDeviceName("");
      setDevicePower("");
      setSelectedBuilding("");
      setSelectedRoomName("");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isAuthLoading) return <div>Loading authentication...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return (
    <Layout title="Add Device" subtitle="Input a new electronic device to a specific room">
      <div className="space-y-4 max-w-3xl mx-auto">
        {error && <div className="text-red-500">{error}</div>}
        {message && <div className="text-green-500">{message}</div>}

        <select value={selectedBuilding} onChange={e => setSelectedBuilding(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Building</option>
          {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        <select value={selectedRoomName} onChange={e => setSelectedRoomName(e.target.value)} className="w-full p-2 border rounded">
          <option value="">Select Room</option>
          {roomOptions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        <input type="text" value={deviceName} onChange={e => setDeviceName(e.target.value)} placeholder="Device Name" className="w-full p-2 border rounded" />

        <input type="number" value={devicePower} onChange={e => setDevicePower(e.target.value)} placeholder="Power (Watt)" className="w-full p-2 border rounded" />

        <button onClick={handleAddDevice} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Device</button>
      </div>
    </Layout>
  );
}
