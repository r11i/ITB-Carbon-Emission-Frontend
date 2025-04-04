"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";

// ✅ Import MapComponent secara dinamis agar tidak menyebabkan masalah SSR
const MapComponent = dynamic(() => import("@/components/MapComponent"), { ssr: false });

export default function Home() {
  const [isOpen, setIsOpen] = useState(false); // State untuk sidebar

  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* ✅ NAVBAR */}
      <nav className="bg-white shadow-md px-6 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-50">
        {/* ✅ Sidebar di Kiri */}
        <button onClick={() => setIsOpen(true)} className="text-gray-700 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* ✅ Judul di Tengah */}
        <h1 className="text-lg font-semibold text-gray-800 absolute left-1/2 transform -translate-x-1/2">
          ITB Carbon Emission Visualization
        </h1>

        {/* ✅ Logo ITB di Kanan */}
        <button onClick={() => window.location.reload()} className="focus:outline-none">
          <Image src="/logo-itb.svg" alt="ITB Logo" width={50} height={50} />
        </button>
      </nav>

      {/* ✅ SIDEBAR (Sekarang di Kiri) */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)}></div>}

      <aside className={`fixed top-0 left-0 w-64 h-full bg-white shadow-md z-50 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold">Menu</h2>
          <button onClick={() => setIsOpen(false)} className="text-gray-600">✕</button>
        </div>
        <ul className="p-4">
          <li className="mb-2">
            <Link href="/" className="text-gray-700 hover:text-blue-500">Home</Link>
          </li>
          <li className="mb-2">
            <Link href="/carbon-emission" className="text-gray-700 hover:text-blue-500">Carbon Emission Calculator</Link>
          </li>
          <li className="mb-2">
            <Link href="/dashboard" className="text-gray-700 hover:text-blue-500">Dashboard</Link>  {/* ✅ Tambahkan Link ke Dashboard */}
          </li>
        </ul>
      </aside>

      {/* ✅ MAP COMPONENT */}
      <MapComponent />
    </div>
  );
}
