"use client";

import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head"; // <-- PENAMBAHAN
import { useRouter } from "next/router"; 
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";

// --- Constants ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const accentColor = "#2563EB";
const disabledColor = "#93C5FD";
const lightBgStart = "#EFF6FF";
const lightBgEnd = "#DBEAFE";
const GANESHA_CAMPUS_API_NAME = "Ganesha";

// --- Tipe Data ---
type FormData = { deviceName:string;power:string;building:string;room:string;usageTime:string };

// --- Komponen Reusable ---
const FormInput: React.FC<any> = ({ label, name, ...props }) => ( <div> <label htmlFor={name} className={`block text-sm font-medium mb-1 ${props.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label> <div className="relative rounded-lg shadow-sm"> <input id={name} name={name} className={`block w-full pl-3 pr-3 py-2.5 border rounded-lg placeholder-gray-400 text-sm transition duration-150 ${props.disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} {...props} /> </div> </div> );
const FormSelect: React.FC<any> = ({ label, name, options, ...props }) => ( <div> <label htmlFor={name} className={`block text-sm font-medium mb-1 ${props.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{label}{props.required && <span className="text-red-500 ml-0.5">*</span>}</label> <div className="relative rounded-lg shadow-sm"> <select id={name} name={name} className={`block w-full pl-3 pr-10 py-2.5 border rounded-lg bg-white text-sm transition duration-150 appearance-none ${props.disabled ? 'bg-gray-100 cursor-not-allowed border-gray-200 text-gray-400' : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${props.disabled ? 'd1d5db' : '6b7280'}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }} {...props}> <option value="" disabled={props.required || options.length > 0}>Select {label.replace(' *', '')}...</option> {options.map((option:string) => <option key={option} value={option}>{option}</option>)} </select> </div> </div> );
const Alert: React.FC<{type:'success'|'error';message:string;}> = ({type,message}) => {const bC="p-4 rounded-lg border flex items-start mb-4 text-sm";const tC=type==='success'?"bg-green-50 border-green-200 text-green-700":"bg-red-50 border-red-200 text-red-700";const Icon=type==='success'?(<svg xmlns="http://www.w3.org/2000/svg"className="h-5 w-5 text-green-500 mr-3 flex-shrink-0"viewBox="0 0 20 20"fill="currentColor"><path fillRule="evenodd"d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"clipRule="evenodd"/></svg>):(<svg xmlns="http://www.w3.org/2000/svg"className="h-5 w-5 text-red-500 mr-3 flex-shrink-0"viewBox="0 0 20 20"fill="currentColor"><path fillRule="evenodd"d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"clipRule="evenodd"/></svg>);const title=type==='success'?'Success':'Error';return(<div className={`${bC} ${tC}`}>{Icon}<div><h3 className="font-medium">{title}</h3><p className="mt-1">{message}</p></div></div>)};
const Spinner = () => (<svg className="animate-spin h-5 w-5 text-white"xmlns="http://www.w3.org/2000/svg"fill="none"viewBox="0 0 24 24"><circle className="opacity-25"cx="12"cy="12"r="10"stroke="currentColor"strokeWidth="4"></circle><path className="opacity-75"fill="currentColor"d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const SpinnerMini: React.FC<{className?:string}> = ({className=""}) => (<svg className={`animate-spin h-4 w-4 ${className}`}xmlns="http://www.w3.org/2000/svg"fill="none"viewBox="0 0 24 24"><circle className="opacity-25"cx="12"cy="12"r="10"stroke="currentColor"strokeWidth="4"></circle><path className="opacity-75"fill="currentColor"d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);

// --- Main Page Component ---
export default function DeviceInputPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const [buildingOptions, setBuildingOptions] = useState<string[]>([]);
  const [roomOptions, setRoomOptions] = useState<string[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ deviceName: "", power: "", building: "", room: "", usageTime: "" });
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const sendAuthorizedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('authToken');
    const isCriticalOperation = options.method === "POST" || url.includes("/emissions/device_input");
    if (!token && isCriticalOperation) {
        logout();
        router.push('/login?sessionExpired=true&message=Authentication token not found. Please login again.');
        throw new Error("Authentication token not found.");
    }
    const newHeaders: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}), };
    if (token) newHeaders['Authorization'] = `Bearer ${token}`;
    const fetchOptions: RequestInit = { ...options, headers: newHeaders };
    try {
        const response = await fetch(url, fetchOptions);
        if (response.status === 401 || response.status === 403) {
            logout();
            router.push('/login?sessionExpired=true&message=Your session is invalid or has expired. Please login again.');
            throw new Error("Unauthorized or Forbidden");
        }
        return response;
    } catch (error) {
        throw error;
    }
  }, [router, logout]);
  const fetchBuildings = useCallback(async () => { setIsLoadingBuildings(true);setOptionsError(null);setBuildingOptions([]);setRoomOptions([]);try{const aU=`${API_BASE_URL}/buildings?campus_name=${encodeURIComponent(GANESHA_CAMPUS_API_NAME)}`;const bR=await sendAuthorizedRequest(aU);if(!bR.ok)throw new Error("Error fetching buildings");const bD=await bR.json();if(!bD.buildings||!Array.isArray(bD.buildings))throw new Error("Invalid building data format");setBuildingOptions(bD.buildings.sort())}catch(e:any){if(e.message!=="Unauthorized or Forbidden")setOptionsError(e.message||"Failed to load buildings")}finally{setIsLoadingBuildings(false)}},[sendAuthorizedRequest]);
  const fetchRoomsForBuilding = useCallback(async (bN: string) => { if(!bN){setRoomOptions([]);return}setIsLoadingRooms(true);setOptionsError(null);setRoomOptions([]);try{const eBN=encodeURIComponent(bN);const aU=`${API_BASE_URL}/rooms?building_name=${eBN}`;const rR=await sendAuthorizedRequest(aU);if(!rR.ok)throw new Error("Error fetching rooms");const rD=await rR.json();if(!rD.rooms||!Array.isArray(rD.rooms))throw new Error("Invalid room data format");setRoomOptions(rD.rooms.sort())}catch(e:any){if(e.message!=="Unauthorized or Forbidden")setOptionsError(e.message||"Failed to load rooms")}finally{setIsLoadingRooms(false)}},[sendAuthorizedRequest]);
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchBuildings();
    }
  }, [isAuthenticated, isAuthLoading, fetchBuildings]);
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => {const{name,value}=e.target;setFormData(p=>({...p,[name]:value}));if(name==="building"){setFormData(p=>({...p,room:""}));setRoomOptions([]);if(value)fetchRoomsForBuilding(value)}setFormError(null);setFormSuccess(null)};
  const handleDateChange = (date: Date|null) => {setSelectedMonth(date);setFormError(null);setFormSuccess(null)};
  const validateForm = (): boolean => {const{deviceName,power,building,room,usageTime}=formData;if(!deviceName.trim()||!power.trim()||!building.trim()||!room.trim()||!usageTime.trim()){setFormError("Please fill all required fields.");return false}if(!selectedMonth){setFormError("Please select the usage month and year.");return false}const pP=parseInt(power);if(isNaN(pP)||pP<=0){setFormError("Power must be a positive number.");return false}const pU=parseInt(usageTime);if(isNaN(pU)||pU<0||pU>744){setFormError("Usage hours must be between 0 and 744.");return false}setFormError(null);return true};
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmittingForm(true);
    setFormSuccess(null);
    setFormError(null);
    const payload={device_name:formData.deviceName.trim(),device_power:parseInt(formData.power),campus_name:GANESHA_CAMPUS_API_NAME,building_name:formData.building,room_name:formData.room,usage_hours:parseInt(formData.usageTime),year:selectedMonth!.getFullYear(),month:selectedMonth!.getMonth()+1};
    try {
      const res=await sendAuthorizedRequest(`${API_BASE_URL}/emissions/device_input`,{method:"POST",body:JSON.stringify(payload)});
      if(!res.ok){const eD=await res.json().catch(()=>({}));throw new Error(eD.error||`Request failed with status ${res.status}`)}
      const result=await res.json();
      setFormSuccess(result.message||"Data saved successfully!");
      setFormData({deviceName:"",power:"",building:"",room:"",usageTime:""});
      setSelectedMonth(null);
      setRoomOptions([]);
      setTimeout(() => { setFormSuccess(null) }, 4000);
    } catch(error:any) {
      if (error.message !== "Unauthorized or Forbidden") {
        setFormError(`Save failed: ${error.message}`);
      }
    } finally {
      setIsSubmittingForm(false);
    }
  };

  if (isAuthLoading) { return <div className="min-h-screen flex items-center justify-center bg-slate-100"><SpinnerMini className="text-blue-500 h-10 w-10" /><p className="ml-3 text-slate-600">Verifying access...</p></div>; }
  if (!isAuthenticated) { return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6"><h1 className="text-2xl font-semibold mb-4 text-slate-800">Access Denied</h1><p className="mb-6 text-slate-600">Please login to access the data input page.</p><Link href="/login?redirectTo=/device-table" legacyBehavior><a className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Login</a></Link></div>;}

  return (
    <>
      <Head>
        <title>Device Management | ITB Carbon Emissions Visualization </title>
        <meta name="description" content="Input new device energy consumption data." />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>

      <Layout
        title="Device Data Input"
        subtitle="Fill in the form below to add new energy consumption data for a device on campus."
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200/60 overflow-hidden">
            <div className="p-6 sm:p-8">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {isLoadingBuildings && !buildingOptions.length && <div className="text-center text-sm text-gray-500"><SpinnerMini className="text-blue-500 mr-2 inline"/>Loading available buildings...</div>}
                {optionsError && <Alert type="error" message={`Failed to load options: ${optionsError}`} />}
                {formError && <Alert type="error" message={formError} />}
                {formSuccess && <Alert type="success" message={formSuccess} />}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-6">
                    <FormInput label="Device Name" name="deviceName" value={formData.deviceName} onChange={handleFormChange} placeholder="e.g., AC Split 1PK" required disabled={isSubmittingForm} />
                    <FormInput label="Power (Watt)" name="power" type="number" value={formData.power} onChange={handleFormChange} placeholder="e.g., 900" min="1" required disabled={isSubmittingForm} />
                  </div>
                  <div className="space-y-6">
                    <div className="relative">
                      <FormSelect label="Building (Ganesha)" name="building" value={formData.building} onChange={handleFormChange} options={buildingOptions} required disabled={isLoadingBuildings||isSubmittingForm||buildingOptions.length===0} />
                    </div>
                    <div className="relative">
                      <FormSelect label="Room" name="room" value={formData.room} onChange={handleFormChange} options={roomOptions} required disabled={isLoadingRooms||isSubmittingForm||!formData.building||(roomOptions.length===0&&!!formData.building&&!isLoadingRooms)} />
                      {isLoadingRooms && <SpinnerMini className="absolute right-10 top-9 text-blue-500"/>}
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Monthly Usage Period</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700">Select Month & Year <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <DatePicker selected={selectedMonth} onChange={handleDateChange} dateFormat="MMMM yyyy" showMonthYearPicker placeholderText="Click to select" className={`w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 border-gray-300`} required popperPlacement="top-start" disabled={isSubmittingForm} />
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <style>{`.react-datepicker-popper{z-index:50 !important;}.react-datepicker__header{background-color:${lightBgStart};border-bottom-color:#DBEAFE;}.react-datepicker__current-month{color:#1E3A8A;}.react-datepicker__day--selected,.react-datepicker__month-text--selected,.react-datepicker__year-text--selected{background-color:${accentColor}!important;color:white!important;}.react-datepicker__day:hover,.react-datepicker__month-text:hover,.react-datepicker__year-text:hover{background-color:${lightBgEnd}!important;}`}</style>
                    </div>
                    <FormInput label="Total Usage (Hours)" name="usageTime" type="number" value={formData.usageTime} onChange={handleFormChange} placeholder="e.g., 120" min="0" max="744" required disabled={isSubmittingForm} />
                  </div>
                </div>
                
                <div className="pt-6 flex justify-end">
                  <button type="submit" disabled={isSubmittingForm||isLoadingBuildings||isLoadingRooms||!!optionsError} style={{backgroundColor:(isSubmittingForm||isLoadingBuildings||isLoadingRooms||!!optionsError)?disabledColor:accentColor}} className={`w-full md:w-auto flex justify-center items-center px-8 py-3 rounded-lg shadow-sm text-base font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${(isSubmittingForm||isLoadingBuildings||isLoadingRooms||!!optionsError)?'opacity-70 cursor-not-allowed':'hover:bg-blue-700 hover:shadow-md'}`}>
                    {isSubmittingForm?<><Spinner/><span className="ml-3">Saving Data...</span></>:'Save Device & Usage'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}