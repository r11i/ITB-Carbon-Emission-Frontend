"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GANESHA_CAMPUS_API_NAME = "Ganesha";

export default function DeleteDevicePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [deviceId, setDeviceId] = useState<number | null>(null);

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [deviceList, setDeviceList] = useState<any[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      logout();
      router.push("/login?sessionExpired=true");
      throw new Error("Unauthorized");
    }
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
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
        .then(data => setBuildingOptions(data.buildings || []))
        .catch(() => setError("Failed to load buildings"));
    }
  }, [isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchWithAuth(`${API_BASE_URL}/rooms?building_name=${selectedBuilding}`)
        .then(res => res.json())
        .then(data => {
          const roomNames = data.rooms?.map(r => r.room_name || r) || [];
          setRoomOptions(roomNames);
        })
        .catch(() => setError("Failed to load rooms"));
    }
  }, [selectedBuilding, fetchWithAuth]);

  useEffect(() => {
    if (selectedRoomName) {
      fetchWithAuth(`${API_BASE_URL}/devices?room_name=${encodeURIComponent(selectedRoomName)}`)
        .then(res => res.json())
        .then(data => {
          setDeviceList(data.devices || []);
        })
        .catch(() => setError("Failed to load devices"));
    }
  }, [selectedRoomName, fetchWithAuth]);

  const handleDelete = async () => {
    setError(null);
    setMessage(null);

    if (!deviceId) {
      setError("Please select a device to delete.");
      return;
    }

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/devices/${deviceId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message || "Device deleted successfully.");
      setDeviceId(null);
      setDeviceList(prev => prev.filter(d => d.device_id !== deviceId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isAuthLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Unauthorized</div>;

  return (
    <Layout title="Delete Device" subtitle="Remove a device from the system">
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

        <select value={deviceId ?? ""} onChange={e => setDeviceId(parseInt(e.target.value))} className="w-full p-2 border rounded">
          <option value="">Select Device to Delete</option>
          {deviceList.map(d => <option key={d.device_id} value={d.device_id}>{`${d.device_name} (ID: ${d.device_id})`}</option>)}
        </select>

        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Delete Device
        </button>
      </div>
    </Layout>
  );
}
