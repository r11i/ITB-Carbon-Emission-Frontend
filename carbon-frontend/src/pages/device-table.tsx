"use client";

import React, { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/router";
import Head from "next/head"; // <-- 1. IMPORT HEAD
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Dialog, Transition } from '@headlessui/react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilSquareIcon, 
  ArrowPathIcon,
  ChevronDownIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

// --- TIPE DATA & KONSTANTA ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GANESHA_CAMPUS_API_NAME = "Ganesha";

type ModalType = 
  | 'ADD_DEVICE' 
  | 'UPDATE_DEVICE' 
  | 'DELETE_DEVICE' 
  | 'ADD_USAGE' 
  | 'UPDATE_USAGE' 
  | 'DELETE_USAGE' 
  | null;

interface Device {
  device_id: number;
  device_name: string;
  device_power: number;
}

interface UsageRecord {
  usage_id: number;
  year: number;
  month: number;
  usage_hours: number;
}

interface Room {
  room_id: number;
  room_name: string;
}

// --- KOMPONEN UI REUSABLE ---
const Spinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <ArrowPathIcon className={`animate-spin ${className}`} />
);

const FullPageLoader: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
    <Spinner className="h-10 w-10 text-blue-600"/>
    <p className="mt-3 text-slate-600">{text}</p>
  </div>
);

const BlueButton: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled = false, className = "", children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
  >
    {children}
  </button>
);

const SecondaryButton: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled = false, className = "", children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:bg-slate-100 disabled:cursor-not-allowed transition-colors duration-200 ${className}`}
  >
    {children}
  </button>
);

// --- KOMPONEN UTAMA HALAMAN ---
export default function DeviceTablePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();

  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<Room[]>([]);
  const [deviceList, setDeviceList] = useState<Device[]>([]);
  const [usageList, setUsageList] = useState<UsageRecord[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState("");
  const [selectedRoomName, setSelectedRoomName] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [itemToEdit, setItemToEdit] = useState<Device | UsageRecord | null>(null);
  const [formData, setFormData] = useState({ deviceName: "", devicePower: "", usageHours: "" });
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      logout();
      router.push("/login?sessionExpired=true");
      throw new Error("Unauthorized");
    }
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers };
    const res = await fetch(url, { ...options, headers });
    if ([401, 403].includes(res.status)) {
      logout();
      router.push("/login?sessionExpired=true");
      throw new Error("Unauthorized");
    }
    return res;
  }, [logout, router]);

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchWithAuth(`${API_BASE_URL}/buildings?campus_name=${GANESHA_CAMPUS_API_NAME}`)
        .then(res => res.json()).then(data => setBuildingOptions(data.buildings || []))
        .catch(() => setError("Failed to load buildings."));
    }
  }, [isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    setSelectedRoomName("");
    setDeviceList([]);
    setSelectedDevice(null);
    if (selectedBuilding) {
      fetchWithAuth(`${API_BASE_URL}/rooms?building_name=${encodeURIComponent(selectedBuilding)}`)
        .then(res => res.json()).then(data => setRoomOptions(data.rooms || []))
        .catch(() => setError("Failed to load rooms."));
    }
  }, [selectedBuilding, fetchWithAuth]);

  const fetchDevices = useCallback(() => {
    if (selectedRoomName && selectedBuilding) {
      setIsLoading(true);
      setDeviceList([]);

      const query = new URLSearchParams({
        room_name: selectedRoomName,
        building_name: selectedBuilding,
      });

      fetchWithAuth(`${API_BASE_URL}/devices?${query.toString()}`)
        .then(res => res.json())
        .then(data => {
          setDeviceList(data.devices || []);
          setError("");
        })
        .catch(() => {
          setError("Failed to load devices.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [selectedRoomName, selectedBuilding, fetchWithAuth]);


  useEffect(() => {
    setDeviceList([]);
    setSelectedDevice(null);
    if(selectedRoomName) fetchDevices();
  }, [selectedRoomName, fetchDevices]);

  useEffect(() => {
    setUsageList([]);
    if (selectedDevice) {
      setIsLoading(true);
      fetchWithAuth(`${API_BASE_URL}/emissions/device_usage?device_id=${selectedDevice.device_id}`)
        .then(res => res.json()).then(data => setUsageList(data.usage_records || []))
        .catch(() => setError("Failed to load usage data."))
        .finally(() => setIsLoading(false));
    }
  }, [selectedDevice, fetchWithAuth]);

  const openModal = (type: ModalType, item: Device | UsageRecord | null = null) => {
    clearMessages();
    setModalType(type);
    setItemToEdit(item);
    if (item) {
      if ('device_name' in item) {
        setFormData({ deviceName: item.device_name, devicePower: String(item.device_power), usageHours: "" });
      }
      if ('usage_hours' in item) {
        setFormData({ deviceName: "", devicePower: "", usageHours: String(item.usage_hours) });
        setSelectedMonth(new Date(item.year, item.month - 1));
      }
    } else {
      setFormData({ deviceName: "", devicePower: "", usageHours: "" });
      setSelectedMonth(null);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setItemToEdit(null);
  };

  const handleFormSubmit = async () => {
    clearMessages();
    setIsLoading(true);

    let url = "";
    let method: "POST" | "PUT" | "DELETE" = "POST";
    let payload: object | undefined;
    let successMessage = "";

    try {
        const room = roomOptions.find(r => r.room_name === selectedRoomName);
        if (!room && modalType?.includes('DEVICE')) throw new Error("Selected room is not valid.");
        
        switch (modalType) {
            case 'ADD_DEVICE':
                url = `${API_BASE_URL}/devices/add`;
                method = 'POST';
                payload = { device_name: formData.deviceName, device_power: parseInt(formData.devicePower), room_id: room!.room_id };
                successMessage = 'Device added successfully.';
                break;
            case 'UPDATE_DEVICE':
                url = `${API_BASE_URL}/devices/${(itemToEdit as Device).device_id}`;
                method = 'PUT';
                payload = { device_name: formData.deviceName, device_power: parseInt(formData.devicePower), room_id: room!.room_id };
                successMessage = 'Device updated successfully.';
                break;
            case 'DELETE_DEVICE':
                url = `${API_BASE_URL}/devices/${(itemToEdit as Device).device_id}`;
                method = 'DELETE';
                successMessage = 'Device deleted successfully.';
                break;
            case 'ADD_USAGE':
                if (!selectedMonth || !selectedDevice) throw new Error("Month/Year is required.");
                url = `${API_BASE_URL}/emissions/device_input`;
                method = 'POST';
                payload = { device_id: selectedDevice.device_id, device_name: selectedDevice.device_name, campus_name: GANESHA_CAMPUS_API_NAME, building_name: selectedBuilding, room_name: selectedRoomName, usage_hours: parseInt(formData.usageHours), year: selectedMonth.getFullYear(), month: selectedMonth.getMonth() + 1 };
                successMessage = 'Usage added successfully.';
                break;
            case 'UPDATE_USAGE':
                if (!selectedMonth || !selectedDevice || !itemToEdit) throw new Error("Data is incomplete.");
                url = `${API_BASE_URL}/emissions/device_usage/update`;
                method = 'PUT';
                payload = { usage_id: (itemToEdit as UsageRecord).usage_id, device_id: selectedDevice.device_id, year: (itemToEdit as UsageRecord).year, month: (itemToEdit as UsageRecord).month, usage_hours: parseInt(formData.usageHours) };
                successMessage = 'Usage updated successfully.';
                break;
            case 'DELETE_USAGE':
                url = `${API_BASE_URL}/emissions/device_usage/delete`;
                method = 'DELETE';
                payload = { usage_id: (itemToEdit as UsageRecord).usage_id };
                successMessage = 'Usage deleted successfully.';
                break;
        }

        const res = await fetchWithAuth(url, { method, body: payload ? JSON.stringify(payload) : undefined });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "An error occurred.");

        setSuccess(successMessage);
        
        if (modalType?.includes('DEVICE')) {
            fetchDevices();
            if (modalType === 'DELETE_DEVICE' && selectedDevice?.device_id === (itemToEdit as Device).device_id) {
                setSelectedDevice(null);
            }
        } else if (selectedDevice) {
            fetchWithAuth(`${API_BASE_URL}/emissions/device_usage?device_id=${selectedDevice.device_id}`)
             .then(r => r.json()).then(d => setUsageList(d.usage_records || []));
        }

        closeModal();
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };
  
  if (isAuthLoading) {
    return <FullPageLoader text="Verifying authentication..." />;
  }

  if (!isAuthenticated) {
    useEffect(() => {
        const timer = setTimeout(() => router.push('/login'), 3000);
        return () => clearTimeout(timer);
    }, [router]);
    return <FullPageLoader text="Access Denied. Redirecting to login..." />;
  }
  
  return (
    <>
      {/* 2. TAMBAHKAN HEAD DI SINI */}
      <Head>
        <title>Device Management | ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Manage devices and their energy usage data." />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>

      <Layout>
        <div className="space-y-6">
          <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <select 
                value={selectedBuilding} 
                onChange={e => setSelectedBuilding(e.target.value)} 
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">-- Select Building --</option>
                {buildingOptions.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="relative">
              <select 
                value={selectedRoomName} 
                onChange={e => setSelectedRoomName(e.target.value)} 
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white disabled:bg-slate-50" 
                disabled={!selectedBuilding}
              >
                <option value="">-- Select Room --</option>
                {roomOptions.map(r => <option key={r.room_id} value={r.room_name}>{r.room_name}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
          {success && <div className="p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">{success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-slate-800">Devices</h2>
                <BlueButton onClick={() => openModal('ADD_DEVICE')} disabled={!selectedRoomName}>
                  <PlusIcon className="h-5 w-5" /> Add Device
                </BlueButton>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Power</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {isLoading && deviceList.length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-4"><Spinner className="h-6 w-6 text-blue-500 inline" /></td></tr>
                    ) : deviceList.length > 0 ? deviceList.map(device => (
                      <tr key={device.device_id} onClick={() => setSelectedDevice(device)} className={`cursor-pointer hover:bg-slate-50 transition-colors ${selectedDevice?.device_id === device.device_id ? 'bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{device.device_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{device.device_power}W</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                          <button onClick={(e) => { e.stopPropagation(); openModal('UPDATE_DEVICE', device); }} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit Device"><PencilSquareIcon className="h-5 w-5" /></button>
                          <button onClick={(e) => { e.stopPropagation(); openModal('DELETE_DEVICE', device); }} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Device"><TrashIcon className="h-5 w-5" /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={3} className="text-center py-8 text-sm text-slate-500">{selectedRoomName ? 'No devices found in this room.' : 'Select a building and room to view devices.'}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              {selectedDevice ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-slate-800 truncate" title={selectedDevice.device_name}>Usage: {selectedDevice.device_name}</h2>
                    <BlueButton onClick={() => openModal('ADD_USAGE')}><PlusIcon className="h-5 w-5" /> Add Usage</BlueButton>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Period</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hours</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {isLoading && usageList.length === 0 ? (
                          <tr><td colSpan={3} className="text-center py-4"><Spinner className="h-6 w-6 text-blue-500 inline" /></td></tr>
                        ) : usageList.length > 0 ? usageList.map(usage => (
                          <tr key={usage.usage_id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{`${usage.year}-${String(usage.month).padStart(2, '0')}`}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{usage.usage_hours}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-4">
                              <button onClick={() => openModal('UPDATE_USAGE', usage)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Edit Usage"><PencilSquareIcon className="h-5 w-5" /></button>
                              <button onClick={() => openModal('DELETE_USAGE', usage)} className="text-red-600 hover:text-red-800 transition-colors" title="Delete Usage"><TrashIcon className="h-5 w-5" /></button>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={3} className="text-center py-8 text-sm text-slate-500">No usage data found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <div className="bg-blue-100 p-3 rounded-full mb-4"><CpuChipIcon className="h-8 w-8 text-blue-600" /></div>
                  <h3 className="text-lg font-medium text-slate-700">Device Not Selected</h3>
                  <p className="text-sm text-slate-500 mt-1">Select a device from the table to view its usage details.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <Transition appear show={!!modalType} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeModal}>
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
              <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
            </Transition.Child>
            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                  <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-200">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-slate-900">{modalType?.replace(/_/g, ' ')}</Dialog.Title>
                    <div className="mt-4 space-y-4">
                      {modalType?.includes('DELETE') ? (
                        <p className="text-sm text-slate-500">Are you sure you want to delete this item? This action cannot be undone.</p>
                      ) : (
                        <>
                          {['ADD_DEVICE', 'UPDATE_DEVICE'].includes(modalType!) && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Device Name</label>
                                <input type="text" value={formData.deviceName} onChange={(e) => setFormData(f => ({...f, deviceName: e.target.value}))} placeholder="Enter device name" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Power (Watt)</label>
                                <input type="number" value={formData.devicePower} onChange={(e) => setFormData(f => ({...f, devicePower: e.target.value}))} placeholder="Enter power in watts" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                              </div>
                            </>
                          )}
                          {['ADD_USAGE', 'UPDATE_USAGE'].includes(modalType!) && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{modalType === 'UPDATE_USAGE' ? 'Period' : 'Select Month & Year'}</label>
                                <DatePicker selected={selectedMonth} onChange={(d: Date | null) => setSelectedMonth(d)} showMonthYearPicker dateFormat="MMMM yyyy" placeholderText="Select Month & Year" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500" disabled={modalType === 'UPDATE_USAGE'}/>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Usage Hours</label>
                                <input type="number" value={formData.usageHours} onChange={(e) => setFormData(f => ({...f, usageHours: e.target.value}))} placeholder="Enter usage hours" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"/>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                      <SecondaryButton onClick={closeModal}>Cancel</SecondaryButton>
                      <BlueButton onClick={handleFormSubmit} disabled={isLoading}>
                        {isLoading ? (<><Spinner className="h-5 w-5" /> Processing...</>) : (modalType?.includes('DELETE') ? 'Delete' : 'Confirm')}
                      </BlueButton>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      </Layout>
    </>
  );
}