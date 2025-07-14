// pages/index.tsx (REVISI - MENGHAPUS INFO GEOSPATIAL)

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  ChartBarIcon,
  DevicePhoneMobileIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// Data (Fitur Geospatial Visualization dihapus)
const features = [
  { name: "Emission Reporting", description: "Periodic tracking of energy consumption and carbon emissions from monitored electronic devices based on input data.", icon: ChartBarIcon },
  { name: "Device-level Input", description: "Allows for detailed inventory and energy profiling of electronic devices within the Ganesha campus infrastructure.", icon: DevicePhoneMobileIcon },
  { name: "Trend Analysis", description: "Historical data analysis to understand emission patterns and inform reduction strategies for Ganesha Campus.", icon: ArrowTrendingUpIcon },
  { name: "Campus-Specific Insights", description: "Analyze energy usage and emissions specifically for ITB Ganesha Campus buildings and facilities.", icon: AcademicCapIcon },
];
const campuses = [
  { name: "Ganesha Campus", location: "Bandung", description: "Primary focus of current carbon footprint monitoring and data collection.", coverage: 90 },
];
const analyticsFeatures = [
  { name: "Campus-Specific Insights", description: "Analyze energy usage and emissions specifically for ITB Ganesha Campus buildings and facilities.", icon: AcademicCapIcon },
  { name: "Device Consumption Analysis", description: "Detailed breakdown of energy consumption by device type and location based on reported usage.", icon: CpuChipIcon },
  { name: "Emission Pattern Identification", description: "Identify key contributors to emissions and potential areas for energy conservation efforts.", icon: ArrowTrendingUpIcon },
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>ITB Carbon Emissions Visualization</title>
        <meta name="description" content="A platform for tracking, visualizing, and analyzing the carbon footprint from electronic devices at ITB." />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>

      <Layout>
        <main>
          {/* Hero Section */}
          <div className="relative isolate overflow-hidden bg-slate-900 rounded-b-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent -z-10"></div>
            <div className="max-w-7xl mx-auto px-6 py-24 sm:py-32 lg:px-8 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-3xl"
              >
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  <span className="block">ITB Carbon Emissions</span>
                  <span className="block text-blue-400">Monitoring Dashboard</span>
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  A platform for tracking, visualizing, and analyzing the carbon footprint from electronic devices, initially focusing on ITB Ganesha Campus.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-x-6 gap-y-4">
                  <Link href="/carbon-dashboard" className="group relative overflow-hidden rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition duration-150 ease-in-out">
                    <span className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative z-10">Launch Dashboard</span>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-gray-50 py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <div className="mx-auto max-w-2xl lg:text-center">
                      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-base font-semibold leading-7 text-blue-600">Sustainable Campus Initiative</motion.h2>
                      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Focused Carbon Monitoring</motion.p>
                      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-6 text-lg leading-8 text-gray-600">This platform provides insights into energy consumption and carbon emissions, starting with ITB Ganesha Campus, to support data-driven sustainability efforts.</motion.p>
                  </div>
                  <div className="mt-20">
                      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                      {features.map((feature, index) => (
                          <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.03, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}
                            className="group relative bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-all duration-300"
                          >
                            <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 blur transition-opacity duration-300"></div>
                            <div className="relative z-10">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md"><feature.icon className="h-6 w-6" /></div>
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
                  <div className="mx-auto max-w-2xl text-center">
                      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Initial Focus: Ganesha Campus</motion.h2>
                      <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-lg leading-8 text-gray-600">The current phase of the project concentrates on collecting and analyzing energy consumption data from the ITB Ganesha campus, laying the groundwork for potential future expansion to other ITB locations.</motion.p>
                  </div>
                  <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="mt-16 max-w-xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl shadow-xl border border-blue-200"
                  >
                      {campuses.map((campus) => (
                      <div key={campus.name}>
                          <h3 className="text-2xl font-semibold text-blue-700">{campus.name}</h3>
                          <p className="mt-2 text-gray-600"><strong className="font-medium text-gray-700">Location:</strong> {campus.location}</p>
                          <p className="mt-1 text-gray-600">{campus.description}</p>
                          <div className="mt-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">Data Coverage Progress:</p>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${campus.coverage}%` }} title={`${campus.coverage}% Estimated Coverage`}></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 text-right">{campus.coverage}%</p>
                          </div>
                      </div>
                      ))}
                  </motion.div>
              </div>
          </div>

          {/* Data Visualization Showcase */}
          <div className="relative bg-slate-900 py-24 sm:py-32">
              <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                  <div className="mx-auto max-w-2xl lg:max-w-none">
                      <div className="text-center">
                          <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Insightful Analytics Dashboard</motion.h2>
                          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-6 text-lg leading-8 text-gray-300 max-w-3xl mx-auto">Explore interactive visualizations providing actionable insights into energy consumption patterns and carbon emissions for the monitored campus.</motion.p>
                      </div>
                      <div className="mt-16 grid grid-cols-1 gap-8 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
                      {analyticsFeatures.map((feature, index) => (
                          <motion.div
                            key={feature.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.15 }}
                            className="flex flex-col rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 backdrop-blur-sm"
                          >
                            <feature.icon className="h-8 w-8 text-blue-400" />
                            <h3 className="mt-6 text-lg font-semibold leading-6 text-white">{feature.name}</h3>
                            <p className="mt-2 flex-1 text-sm leading-6 text-gray-300">{feature.description}</p>
                            <Link href="/carbon-dashboard" className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">Explore Dashboard <span aria-hidden="true">→</span></Link>
                          </motion.div>
                      ))}
                      </div>
                  </div>
              </div>
          </div>

          {/* CTA Section */}
          <div className="bg-white">
              <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
                  <div className="relative isolate overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pt-16 shadow-2xl rounded-3xl sm:px-16 md:pt-24 lg:px-24">
                      <svg viewBox="0 0 1024 1024" className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0" aria-hidden="true">
                          <circle cx={512} cy={512} r={512} fill="url(#gradient-cta-about-blue)" fillOpacity="0.7" />
                          <defs><radialGradient id="gradient-cta-about-blue"><stop stopColor="#3b82f6" /><stop offset={1} stopColor="#4f46e5" /></radialGradient></defs>
                      </svg>
                      <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-2xl text-center">
                          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Drive Sustainability?</h2>
                          <p className="mt-6 text-lg leading-8 text-blue-100">Explore the dashboard, analyze the data, and contribute to understanding and reducing ITB's carbon footprint for a greener future.</p>
                          <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link href="/carbon-dashboard" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors">Get Started</Link>
                          </div>
                      </motion.div>
                      <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: 50 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.6, delay: 0.2, type: 'spring', stiffness: 100 }}
                          className="mt-16 flex justify-center pb-16"
                      >
                          <div className="w-full max-w-5xl">
                              <Image
                                className="rounded-xl shadow-2xl ring-1 ring-white/10"
                                src="/carbon-dashboard.png"
                                alt="App screenshot"
                                width={1824}
                                height={1080}
                              />
                          </div>
                      </motion.div>
                  </div>
              </div>
          </div>
        </main>
      </Layout>
    </>
  );
}