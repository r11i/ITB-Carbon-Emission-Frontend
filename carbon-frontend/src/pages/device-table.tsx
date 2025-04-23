"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// --- Constants (Consistent Blue Theme) ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const accentColor = "#2563EB"; // Blue-600
const accentColorHover = "#1D4ED8"; // Blue-700
const accentColorFocusRing = "#3B82F6"; // Blue-500
const lightBgStart = "#EFF6FF"; // Blue-50
const lightBgEnd = "#DBEAFE"; // Blue-100
const disabledColor = "#60A5FA"; // Blue-400

// --- Types ---
interface DisplayDeviceData {
  device_name: string;
  quantity: number | string;
  power: number | string;
  daily_usage: number | string;
  monthly_consumption_kwh: number;
  cost_per_kwh: number;
  monthly_cost: number;
}

interface ApiDeviceEmissionsResponse {
  filter: { campus: string; year: string };
  device_emissions: { [deviceName: string]: number };
}

type FormData = {
  deviceName: string;
  power: string;
  campus: string;
  building: string;
  room: string;
  usageTime: string;
};

export default function DeviceTablePage() {
  const router = useRouter();

  // --- State for Table ---
  const [deviceData, setDeviceData] = useState<DisplayDeviceData[]>([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);
  const costPerKwh = 0.147;

  // --- State for Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- State for Form Options (Dynamic) ---
  const [campusOptions, setCampusOptions] = useState<string[]>([]);
  const [buildingOptions, setBuildingOptions] = useState<string[]>([]); // Will hold filtered buildings
  const [roomOptions, setRoomOptions] = useState<string[]>([]); // Will hold filtered rooms
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(true); // Initial loading
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false); // Loading for dependent buildings
  const [isLoadingRooms, setIsLoadingRooms] = useState(false); // Loading for dependent rooms
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // --- State for Form (inside Modal) ---
  const [formData, setFormData] = useState<FormData>({
    deviceName: "", power: "", campus: "", building: "", room: "", usageTime: "",
  });
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // --- Data Fetching for Table ---
  const fetchDeviceData = useCallback(async () => {
    // ... (fetchDeviceData logic remains the same)
    setIsLoadingTable(true);
    setTableError(null);
    try {
      const currentYear = new Date().getFullYear();
      const apiUrl = `${API_BASE_URL}/emissions/device?year=${currentYear}`;

      const devicesResponse = await fetch(apiUrl);
      if (!devicesResponse.ok) {
        const errorData = await devicesResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch device emissions (${devicesResponse.status})`);
      }
      const devicesApiData: ApiDeviceEmissionsResponse = await devicesResponse.json();

      if (!devicesApiData.device_emissions || typeof devicesApiData.device_emissions !== 'object') {
        throw new Error("Invalid data format received from /emissions/device API");
      }

      const formattedData: DisplayDeviceData[] = Object.entries(devicesApiData.device_emissions)
        .map(([deviceName, consumptionKwh]) => ({
          device_name: deviceName,
          quantity: 'N/A',
          power: 'N/A',
          daily_usage: 'N/A',
          monthly_consumption_kwh: consumptionKwh,
          cost_per_kwh: costPerKwh,
          monthly_cost: consumptionKwh * costPerKwh,
        }))
        .sort((a, b) => b.monthly_consumption_kwh - a.monthly_consumption_kwh);

      setDeviceData(formattedData);
    } catch (err) {
      console.error("Error fetching device data:", err);
      setTableError(err instanceof Error ? err.message : "An unknown error occurred while fetching table data");
      setDeviceData([]);
    } finally {
      setIsLoadingTable(false);
    }
  }, []);

  // --- Data Fetching for Form Options ---

  // Fetch only Campuses initially
  const fetchCampuses = useCallback(async () => {
    setIsLoadingCampuses(true);
    setOptionsError(null);
    setCampusOptions([]);
    try {
      const campusRes = await fetch(`${API_BASE_URL}/campuses`);
      if (!campusRes.ok) throw new Error(`Failed to fetch campuses (${campusRes.status})`);
      const campusData = await campusRes.json();
      // Backend now returns sorted array: { campuses: [{campus_name: "A"}, {campus_name: "B"}] }
      if (!campusData.campuses || !Array.isArray(campusData.campuses)) throw new Error("Invalid campus data format");
      setCampusOptions(campusData.campuses.map((c: { campus_name: string }) => c.campus_name)); // Already sorted by backend
    } catch (err) {
      console.error("Error fetching form options (campuses):", err);
      setOptionsError(err instanceof Error ? err.message : "Failed to load campus options.");
    } finally {
      setIsLoadingCampuses(false);
    }
  }, []);

  // Fetch Buildings based on selected Campus
  const fetchBuildingsForCampus = useCallback(async (campusName: string) => {
    if (!campusName) {
      setBuildingOptions([]); // Clear if no campus is selected
      return;
    }
    setIsLoadingBuildings(true);
    setOptionsError(null); // Clear previous errors specific to options
    setBuildingOptions([]); // Clear previous options
    setRoomOptions([]); // Also clear room options when campus changes
    try {
      const encodedCampusName = encodeURIComponent(campusName); // Encode for URL
      const buildingRes = await fetch(`${API_BASE_URL}/buildings?campus_name=${encodedCampusName}`);
      if (!buildingRes.ok) {
        const errorData = await buildingRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch buildings for ${campusName} (${buildingRes.status})`);
      }
      const buildingData = await buildingRes.json();
      // Backend now returns sorted array: { buildings: ["Building A", "Building B"] }
      if (!buildingData.buildings || !Array.isArray(buildingData.buildings)) throw new Error("Invalid building data format");
      setBuildingOptions(buildingData.buildings); // Already sorted by backend
    } catch (err) {
      console.error("Error fetching buildings:", err);
      setOptionsError(err instanceof Error ? err.message : "Failed to load building options.");
       setBuildingOptions([]); // Clear options on error
    } finally {
      setIsLoadingBuildings(false);
    }
  }, []);

  // Fetch Rooms based on selected Building
  const fetchRoomsForBuilding = useCallback(async (buildingName: string) => {
    if (!buildingName) {
      setRoomOptions([]); // Clear if no building is selected
      return;
    }
    setIsLoadingRooms(true);
    setOptionsError(null); // Clear previous errors specific to options
    setRoomOptions([]); // Clear previous options
    try {
      const encodedBuildingName = encodeURIComponent(buildingName); // Encode for URL
      const roomRes = await fetch(`${API_BASE_URL}/rooms?building_name=${encodedBuildingName}`);
      if (!roomRes.ok) {
        const errorData = await roomRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch rooms for ${buildingName} (${roomRes.status})`);
      }
      const roomData = await roomRes.json();
       // Backend now returns sorted array: { rooms: ["Room 101", "Room 102"] }
      if (!roomData.rooms || !Array.isArray(roomData.rooms)) throw new Error("Invalid room data format");
      setRoomOptions(roomData.rooms); // Already sorted by backend
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setOptionsError(err instanceof Error ? err.message : "Failed to load room options.");
      setRoomOptions([]); // Clear options on error
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // --- Initial Data Fetch ---
  useEffect(() => {
    fetchDeviceData();
    fetchCampuses(); // Fetch only campuses initially
  }, [fetchDeviceData, fetchCampuses]);

  // --- Form Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Update form data state
    setFormData(prev => ({ ...prev, [name]: value }));

    // Handle dependent dropdown fetches
    if (name === "campus") {
      setFormData(prev => ({ ...prev, building: "", room: "" })); // Reset building and room
      setBuildingOptions([]); // Clear building options immediately
      setRoomOptions([]); // Clear room options immediately
      fetchBuildingsForCampus(value); // Fetch buildings for the selected campus
    } else if (name === "building") {
      setFormData(prev => ({ ...prev, room: "" })); // Reset room
      setRoomOptions([]); // Clear room options immediately
      fetchRoomsForBuilding(value); // Fetch rooms for the selected building
    }

    // Clear status messages on any change
    setFormError(null);
    setFormSuccess(null);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedMonth(date);
    setFormError(null);
    setFormSuccess(null);
  };

  // --- Form Validation ---
  const validateForm = (): boolean => {
    // ... (validateForm logic remains the same)
    const { deviceName, power, campus, building, room, usageTime } = formData;

    if (!deviceName.trim() || !power.trim() || !campus.trim() || !building.trim() || !room.trim() || !usageTime.trim()) {
      setFormError("Please fill in all fields.");
      return false;
    }
    if (!selectedMonth) {
       setFormError("Please select the usage period month.");
       return false;
    }
    const parsedPower = parseInt(power);
    if (isNaN(parsedPower) || parsedPower <= 0) {
      setFormError("Power consumption must be a positive number (Watt).");
      return false;
    }
    const parsedUsage = parseInt(usageTime);
    if (isNaN(parsedUsage) || parsedUsage < 0 || parsedUsage > 744) {
       setFormError("Total usage hours must be a number between 0 and 744.");
       return false;
    }
    setFormError(null);
    return true;
  };

  // --- Form Submission ---
  const handleFormSubmit = async (e: React.FormEvent) => {
    // ... (handleFormSubmit logic remains the same, using formData which is up-to-date)
     e.preventDefault();
    if (!validateForm()) return;

    setIsSubmittingForm(true);
    setFormSuccess(null);
    setFormError(null);

    const payload = {
        device_name: formData.deviceName.trim(),
        device_power: parseInt(formData.power),
        campus_name: formData.campus,
        building_name: formData.building,
        room_name: formData.room, // Use the dynamically selected room
        usage_hours: parseInt(formData.usageTime),
        year: selectedMonth!.getFullYear(),
        month: selectedMonth!.getMonth() + 1,
    };

    console.log("Attempting to submit to /emissions/device-input with payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${API_BASE_URL}/emissions/device_input`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          let errorBody = { error: `Request failed with status ${res.status}` };
          let detailedErrorMessage = errorBody.error;
          try {
            const serverError = await res.json();
            console.error("Server Error Response (JSON):", serverError);
            detailedErrorMessage = serverError.error || serverError.message || JSON.stringify(serverError);
          } catch (parseErr) {
             try {
                const textError = await res.text();
                console.error("Server Error Response (Text):", textError);
                detailedErrorMessage = textError || `Request failed with status ${res.status} and non-JSON response.`;
             } catch (textErr) {
                console.error("Failed to read server error response body.");
             }
          }
          throw new Error(`${detailedErrorMessage} (${res.status})`);
        }

        const result = await res.json();
        console.log("Submission successful:", result);

        setFormSuccess(result.message || "Device and usage data saved successfully!");
        setFormData({ deviceName: "", power: "", campus: "", building: "", room: "", usageTime: "" }); // Reset form
        setSelectedMonth(null); // Reset date picker
        setBuildingOptions([]); // Clear dependent options after success
        setRoomOptions([]); // Clear dependent options after success


        await fetchDeviceData(); // Refresh the table data

        setTimeout(() => {
           setIsModalOpen(false);
            // setFormSuccess(null); // Optionally clear success on close
        }, 1500);

    } catch (error: any) {
      console.error("Form submission error:", error);
      setFormError(`Failed to save data: ${error.message || 'Unknown error occurred.'}`);
    } finally {
       setTimeout(() => setIsSubmittingForm(false), 1500);
    }
  };

  // --- Modal Control ---
  const openModal = () => {
    setFormData({ deviceName: "", power: "", campus: "", building: "", room: "", usageTime: "" });
    setSelectedMonth(null);
    setFormError(null);
    setFormSuccess(null);
    setIsSubmittingForm(false);
    setBuildingOptions([]); // Clear dependent options when opening
    setRoomOptions([]); // Clear dependent options when opening
    // Fetch campuses again in case they changed, or rely on initial fetch
    fetchCampuses(); // Re-fetch campuses every time modal opens (optional)
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmittingForm && !formSuccess && !formError) return;
    setIsModalOpen(false);
  };

  // --- Export Function ---
  const handleExport = () => {
     // ... (handleExport logic remains the same)
     if (!deviceData.length) return;
     const headers = ["Device Name", "Qty", "Power (W)", "Daily Usage (hrs)", "Monthly kWh", "Cost/kWh ($)", "Monthly Cost ($)"];
     const rows = deviceData.map(d => [
       `"${d.device_name.replace(/"/g, '""')}"`,
       d.quantity,
       d.power,
       d.daily_usage,
       d.monthly_consumption_kwh.toFixed(2),
       d.cost_per_kwh.toFixed(3),
       d.monthly_cost.toFixed(2)
     ].join(","));
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", "itb_energy_report_by_device.csv");
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  // --- JSX ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-10">
         {/* ... (Header JSX remains the same) ... */}
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/")} className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors group">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              ITB Energy Consumption
            </h1>
            <div className="w-5"></div> {/* Spacer */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200/60 transition-all hover:shadow-xl">
          {/* Card Header */}
          <div className={`px-6 py-5 border-b border-gray-200/60 bg-gradient-to-r from-[${lightBgStart}] to-[${lightBgEnd}]/50`}>
            {/* ... (Card Header JSX remains the same) ... */}
            <div className="flex flex-wrap items-center justify-between gap-4">
               {/* Title Section */}
               <div className="flex items-center">
                 <div className="p-2 rounded-lg bg-blue-100 mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                 </div>
                 <div>
                   <h2 className="text-xl font-semibold text-gray-800">Device Energy Consumption</h2>
                   <p className="text-sm text-gray-600 mt-1">Aggregated monthly consumption by device name</p>
                 </div>
               </div>
               {/* Action Buttons */}
               <div className="flex items-center space-x-3">
                 <button onClick={openModal} style={{ backgroundColor: accentColor }} className={`px-4 py-2 text-sm text-white rounded-lg flex items-center transition-all duration-150 ease-in-out shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${accentColorFocusRing.substring(1)} hover:bg-${accentColorHover.substring(1)}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg> Add Device
                 </button>
                 <button onClick={handleExport} disabled={isLoadingTable || !!tableError || deviceData.length === 0} className={`px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg flex items-center transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${ (isLoadingTable || !!tableError || deviceData.length === 0) ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700' }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1.5 ${ (isLoadingTable || !!tableError || deviceData.length === 0) ? 'text-gray-400' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Export CSV
                 </button>
               </div>
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {/* ... (Table JSX remains the same) ... */}
             {isLoadingTable ? (
              <div className="p-12 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
            ) : tableError ? (
              <div className="p-6 text-center"><div className="inline-flex items-center bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>Error fetching data: {tableError}</div></div>
            ) : deviceData.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No device consumption data found for the selected period. Try adding a device.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                 <thead className="bg-gray-50">
                   <tr>
                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device Name</th>
                     <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Power (W)</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Daily Use (hr)</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Monthly (kWh)</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cost/kWh ($)</th>
                     <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider font-semibold">Total Monthly Cost ($)</th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {deviceData.map((device, index) => (
                     <tr key={device.device_name + index} className="hover:bg-blue-50/50 transition-colors duration-150 ease-in-out">
                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{device.device_name}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{device.quantity}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.power}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.daily_usage}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.monthly_consumption_kwh.toFixed(2)}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{device.cost_per_kwh.toFixed(3)}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-medium">${device.monthly_cost.toFixed(2)}</td>
                     </tr>
                   ))}
                   <tr className="bg-gray-50 font-semibold">
                      <td className="px-6 py-3 text-left text-xs text-gray-700 uppercase tracking-wider">Total</td>
                      <td colSpan={3}></td>
                      <td className="px-6 py-3 text-right text-sm text-gray-700">{deviceData.reduce((sum, d) => sum + d.monthly_consumption_kwh, 0).toFixed(2)} kWh</td>
                      <td></td>
                      <td className="px-6 py-3 text-right text-sm text-gray-900">${deviceData.reduce((sum, d) => sum + d.monthly_cost, 0).toFixed(2)}</td>
                   </tr>
                 </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Add New Device & Monthly Usage</h2>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close modal">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleFormSubmit} className="space-y-5">
             {/* Display options loading/error state */}
             {/* Separate loading states give more granular feedback */}
             {(isLoadingCampuses) && <div className="text-center text-gray-500 py-2 text-sm">Loading campuses...</div>}
             {optionsError && <Alert type="error" message={`Failed to load options: ${optionsError}`} />}
             {/* Form submission status */}
             {formError && <Alert type="error" message={formError} />}
             {formSuccess && <Alert type="success" message={formSuccess} />}

             {/* Inputs */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
               <div className="space-y-4">
                 {/* Device Name and Power are always active once campuses loaded */}
                 <FormInput label="Device Name" name="deviceName" value={formData.deviceName} onChange={handleFormChange} placeholder="e.g., AC Split 1PK" required disabled={isLoadingCampuses}/>
                 <FormInput label="Power (Watt)" name="power" type="number" value={formData.power} onChange={handleFormChange} placeholder="e.g., 900" min="1" required disabled={isLoadingCampuses}/>
               </div>
               <div className="space-y-4">
                 {/* Campus Dropdown */}
                 <FormSelect
                    label="Campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleFormChange}
                    options={campusOptions}
                    required
                    disabled={isLoadingCampuses || campusOptions.length === 0} // Disable while loading or if no options
                 />
                 {/* Building Dropdown */}
                 <div className="relative">
                     <FormSelect
                        label="Building"
                        name="building"
                        value={formData.building}
                        onChange={handleFormChange}
                        options={buildingOptions} // Use filtered state
                        required
                        // Disable if campuses loading, no campus selected, or buildings are loading
                        disabled={isLoadingCampuses || !formData.campus || isLoadingBuildings}
                     />
                      {isLoadingBuildings && <SpinnerMini className="absolute right-10 top-9 text-blue-500" />}
                 </div>

                 {/* Room Dropdown */}
                  <div className="relative">
                     <FormSelect
                        label="Room"
                        name="room"
                        value={formData.room}
                        onChange={handleFormChange}
                        options={roomOptions} // Use filtered state
                        required
                        // Disable if campuses loading, no building selected, or rooms are loading
                        disabled={isLoadingCampuses || !formData.building || isLoadingRooms}
                      />
                      {isLoadingRooms && <SpinnerMini className="absolute right-10 top-9 text-blue-500" />}
                 </div>
               </div>
             </div>

             {/* Monthly Usage Section */}
             <div className="pt-5 mt-5 border-t border-gray-200/60">
              <h3 className="text-base font-semibold text-gray-700 mb-4">Monthly Usage</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Usage Period <span className="text-red-500">*</span></label>
                   <div className="relative">
                     <DatePicker
                       selected={selectedMonth}
                       onChange={handleDateChange}
                       dateFormat="MMMM yyyy"
                       showMonthYearPicker
                       placeholderText="Select month & year"
                       className={`w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed`}
                       required
                       popperPlacement="top-start"
                       disabled={isLoadingCampuses} // Disable if initial options haven't loaded
                     />
                     <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                   </div>
                   <style>{`.react-datepicker-popper { z-index: 50 !important; } .react-datepicker__header { background-color: ${lightBgStart}; border-bottom-color: #DBEAFE; } .react-datepicker__current-month { color: #1E3A8A; } .react-datepicker__day--selected, .react-datepicker__month-text--selected { background-color: ${accentColor}; } .react-datepicker__day:hover, .react-datepicker__month-text:hover { background-color: #DBEAFE; }`}</style>
                 </div>
                 <FormInput label="Total Usage (Hours)" name="usageTime" type="number" value={formData.usageTime} onChange={handleFormChange} placeholder="e.g., 120" min="0" max="744" required disabled={isLoadingCampuses}/>
               </div>
             </div>

             {/* Submit Button */}
             <div className="pt-6">
               <button
                  type="submit"
                  // Disable submit if any options are loading, error occurred, or form is submitting
                  disabled={isSubmittingForm || isLoadingCampuses || isLoadingBuildings || isLoadingRooms || !!optionsError}
                  style={{ backgroundColor: (isSubmittingForm || isLoadingCampuses || isLoadingBuildings || isLoadingRooms || !!optionsError) ? disabledColor : accentColor }}
                  className={`w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${ (isSubmittingForm || isLoadingCampuses || isLoadingBuildings || isLoadingRooms || !!optionsError) ? 'opacity-70 cursor-not-allowed' : `hover:bg-[${accentColorHover}] hover:shadow-md` }`}
               >
                 {isSubmittingForm ? <><Spinner /><span className="ml-2">Saving...</span></> : 'Save Device & Usage'}
               </button>
             </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

// --- Reusable Modal Component ---
// ... (Modal component remains the same)
type ModalProps = { isOpen: boolean; onClose: () => void; children: React.ReactNode; };
const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return ( <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-40 transition-opacity duration-300 ease-out" onClick={onClose} aria-labelledby="modal-title" role="dialog" aria-modal="true"> <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 ease-out scale-95 opacity-0 animate-modal-enter" onClick={(e) => e.stopPropagation()}> {children} </div> <style>{`@keyframes modal-enter { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } } .animate-modal-enter { animation: modal-enter 0.2s ease-out forwards; }`}</style> </div> );
};


// --- Reusable Form Components ---
// ... (FormInput, FormSelect, Alert, Spinner remain the same)
type FormInputProps = { label: string; icon?: React.ReactNode; } & React.InputHTMLAttributes<HTMLInputElement>;
const FormInput = ({ label, name, icon, ...props }: FormInputProps) => ( <div> <label htmlFor={name} className={`block text-sm font-medium mb-1 ${props.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label> <div className="relative rounded-lg shadow-sm"> {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>} <input id={name} name={name} className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-2.5 border rounded-lg placeholder-gray-400 text-sm transition duration-150 ${props.disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} {...props} /> </div> </div> );

type FormSelectProps = { label: string; options: string[]; icon?: React.ReactNode; } & React.SelectHTMLAttributes<HTMLSelectElement>;
const FormSelect = ({ label, name, options, icon, ...props }: FormSelectProps) => ( <div> <label htmlFor={name} className={`block text-sm font-medium mb-1 ${props.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label> <div className="relative rounded-lg shadow-sm"> {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>} <select id={name} name={name} className={`block w-full ${icon ? 'pl-10' : 'pl-3'} pr-10 py-2.5 border rounded-lg bg-white text-sm transition duration-150 appearance-none ${props.disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${props.disabled ? 'd1d5db' : '6b7280'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }} {...props}> <option value="" disabled={props.required || options.length > 0}>Select {label.replace(' *', '')}...</option> {options.map(option => <option key={option} value={option}>{option}</option>)} </select> </div> </div> );

type AlertProps = { type: 'success' | 'error'; message: string; };
const Alert = ({ type, message }: AlertProps) => { const baseClasses="p-4 rounded-lg border flex items-start mb-4 text-sm"; const typeClasses=type==='success'?"bg-green-50 border-green-200 text-green-700":"bg-red-50 border-red-200 text-red-700"; const Icon=type==='success'?(<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>):(<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>); const title=type==='success'?'Success':'Error'; return ( <div className={`${baseClasses} ${typeClasses}`}> {Icon} <div> <h3 className="font-medium">{title}</h3> <p className="mt-1">{message}</p> </div> </div> ); };

const Spinner = () => (<svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

// Smaller spinner for dropdowns
const SpinnerMini = ({ className = "" }: { className?: string }) => (<svg className={`animate-spin h-4 w-4 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);