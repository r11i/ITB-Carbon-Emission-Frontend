// src/pages/about.tsx
"use client"; // Client component karena menggunakan framer-motion dan event handlers

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ChartBarIcon,
  MapIcon as OutlineMapIcon,
  DevicePhoneMobileIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline"; // Gunakan ikon outline
import { MapIcon as SolidMapIcon } from "@heroicons/react/24/solid"; // Contoh ikon solid jika perlu

// Data Fitur
const features = [
  { name: "Geospatial Visualization", description: "Interactive map interface showing carbon emissions across ITB campuses with drill-down capability.", icon: OutlineMapIcon },
  { name: "Real-time Monitoring", description: "Live tracking of energy consumption and carbon emissions from monitored electronic devices.", icon: ChartBarIcon },
  { name: "Device-level Tracking", description: "Detailed inventory and energy profiling of electronic devices across campus infrastructure.", icon: DevicePhoneMobileIcon },
  { name: "Trend Analysis", description: "Historical data analysis and predictive modeling for emission reduction strategies.", icon: ArrowTrendingUpIcon },
];

// Data Kampus (Contoh)
const campuses = [
  { name: "Ganesha Campus", location: "Bandung", devices: 1250, coverage: 95 },
  { name: "Jatinangor Campus", location: "Sumedang", devices: 850, coverage: 88 },
  { name: "Cirebon Campus", location: "Cirebon", devices: 420, coverage: 75 },
  { name: "Jakarta Campus", location: "Jakarta", devices: 680, coverage: 82 },
  { name: "Bosscha Observatory", location: "Lembang", devices: 150, coverage: 65 },
];

// Data Fitur Analitik
const analyticsFeatures = [
  { name: "Campus Comparison", description: "Compare energy usage and emissions between different ITB campuses and buildings.", icon: GlobeAltIcon },
  { name: "Device Analytics", description: "Detailed breakdown of energy consumption by device type, location, and usage patterns.", icon: CpuChipIcon },
  { name: "Emission Forecasting", description: "Predictive models showing potential emission reductions from conservation measures.", icon: ArrowTrendingUpIcon },
];

export default function AboutPage() {
  return (
    // Gradasi latar belakang halus
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-gray-900">
        {/* Gambar Latar */}
        <Image
          src="/images/itb-campus-night.jpg" // Pastikan path benar
          alt="ITB Campus at Night"
          fill
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-30"
          priority
        />
        {/* Overlay Gradasi */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent -z-10"></div>
        {/* Konten Hero */}
        <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl backdrop-blur-md bg-black/40 p-8 rounded-2xl border border-white/10 shadow-2xl"
          >
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              <span className="block">ITB Carbon Emissions</span>
              <span className="block text-emerald-400">Dashboard</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              An advanced platform for tracking, visualizing, and optimizing the carbon footprint from electronic devices across all ITB campuses.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-x-6 gap-y-4">
              <Link href="/carbon-dashboard" className="group relative overflow-hidden rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition duration-150 ease-in-out">
                <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span><span className="relative z-10">Launch Dashboard</span>
              </Link>
              <Link href="/" className="text-sm font-semibold leading-6 text-white flex items-center gap-1 hover:text-emerald-300 transition-colors">View Campus Map <span aria-hidden="true">→</span></Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Judul Section */}
          <div className="mx-auto max-w-2xl lg:text-center">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-base font-semibold leading-7 text-emerald-600">Sustainable Campus Initiative</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Comprehensive Carbon Monitoring</motion.p>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 text-lg leading-8 text-gray-600">Our platform provides real-time insights into energy consumption and carbon emissions across ITB's infrastructure, enabling data-driven sustainability decisions.</motion.p>
          </div>
          {/* Grid Fitur */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -8, scale: 1.03, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                  className="group relative bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300 cursor-pointer"
                >
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md"><feature.icon className="h-6 w-6" /></div>
                    <h3 className="mt-6 text-lg font-semibold leading-6 text-gray-900">{feature.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campus Coverage Section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Judul Section */}
          <div className="mx-auto max-w-2xl text-center">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Extensive Campus Coverage</motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-lg leading-8 text-gray-600">Monitoring energy consumption and carbon emissions across all major ITB campuses using IoT-enabled devices and data integration.</motion.p>
          </div>
          {/* Tabel Kampus */}
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mt-16 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 rounded-lg border border-gray-100">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Campus</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Location</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 hidden sm:table-cell">Devices Monitored</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Est. Coverage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {campuses.map((campus) => (
                        <tr key={campus.name} className="hover:bg-gray-50 transition-colors">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">{campus.name}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{campus.location}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 hidden sm:table-cell">~{campus.devices.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden"><div className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2.5 rounded-full" style={{ width: `${campus.coverage}%` }} title={`${campus.coverage}% Coverage`}></div></div>
                              <span className="font-medium">{campus.coverage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Data Visualization Showcase */}
      <div className="relative bg-gray-900 py-24 sm:py-32">
        {/* Gambar Latar */}
        <div className="absolute inset-0 overflow-hidden"><Image src="/images/itb-data-center.jpg" alt="Abstract data visualization background" fill className="h-full w-full object-cover opacity-15" /><div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-transparent to-gray-900"></div></div>
        {/* Konten Showcase */}
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:max-w-none">
            {/* Judul Section */}
            <div className="text-center">
              <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Insightful Analytics Dashboard</motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Explore interactive visualizations providing actionable insights into energy consumption patterns, carbon emissions, and potential savings.</motion.p>
            </div>
            {/* Grid Fitur Analitik */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
              {analyticsFeatures.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="flex flex-col rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 backdrop-blur-sm"
                >
                  <feature.icon className="h-8 w-8 text-emerald-400" />
                  <h3 className="mt-6 text-lg font-semibold leading-6 text-white">{feature.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-gray-300">{feature.description}</p>
                   <Link href="/carbon-dashboard" className="mt-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">Explore Feature <span aria-hidden="true">→</span></Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="relative isolate overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 px-6 pt-16 shadow-2xl rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
                {/* Efek SVG Latar */}
                <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0" aria-hidden="true">
                    <circle cx={512} cy={512} r={512} fill="url(#gradient-cta-about)" fillOpacity="0.7" />
                    <defs><radialGradient id="gradient-cta-about"><stop stopColor="#7775D6" /><stop offset={1} stopColor="#10B981" /></radialGradient></defs>
                </svg>
              {/* Konten Teks CTA */}
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Drive Sustainability?</h2>
                <p className="mt-6 text-lg leading-8 text-emerald-100">Explore the dashboard, analyze the data, and contribute to reducing ITB's carbon footprint for a greener future.</p>
                <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                  <Link href="/carbon-dashboard" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">Get Started</Link>
                  <span onClick={(e) => e.preventDefault()} className="text-sm font-semibold leading-6 text-white cursor-not-allowed opacity-70">Learn more <span aria-hidden="true">→</span></span> {/* Disable link jika belum ada */}
                </div>
              </motion.div>
              {/* Gambar CTA (opsional) */}
              <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="relative mt-16 h-80 lg:mt-8 hidden lg:block">
                    <Image className="absolute left-0 top-0 w-[57rem] max-w-none rounded-md bg-white/5 ring-1 ring-white/10 object-cover object-top" src="/images/dashboard-screenshot.png" alt="App screenshot" width={1824} height={1080}/>
              </motion.div>
            </div>
          </div>
        </div>
    </div>
  );
}