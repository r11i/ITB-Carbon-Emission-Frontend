// pages/presentation.tsx
"use client";

import { motion } from "framer-motion";
import Head from "next/head";
import Layout from "@/components/Layout";
import {
  AcademicCapIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  CpuChipIcon,
  LightBulbIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

const slides = [
  {
    title: "Presentasi Sidang Tugas Akhir",
    subtitle: "Pengembangan Frontend Aplikasi Website untuk Visualisasi Emisi Jejak Karbon dari Peralatan Elektronik (Studi Kasus: Kampus ITB Ganesha)",
    content: (
      <div className="text-center">
        <p className="text-lg text-gray-600 mb-6">
          Disusun oleh: <span className="font-semibold">Regine Fidellia Hendyawan</span>
        </p>
        <p className="text-lg text-gray-600">
          NIM: <span className="font-semibold">18221025</span>
        </p>
        <p className="text-lg text-gray-600 mt-4">
          Program Studi: <span className="font-semibold">Sistem dan Teknologi Informasi</span>
        </p>
        <p className="text-lg text-gray-600">
          Sekolah Teknik Elektro dan Informatika
        </p>
        <p className="text-lg text-gray-600">
          Institut Teknologi Bandung
        </p>
        <p className="text-lg text-gray-600 mt-4">
          Dosen Pembimbing: <span className="font-semibold">Prof. Ir. Kridanto Surendro, M.Sc., Ph.D.</span>
        </p>
      </div>
    ),
    icon: PresentationChartBarIcon,
  },
  {
    title: "Latar Belakang",
    content: (
      <div className="space-y-4 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Konteks Global & Nasional</h3>
            <ul className="list-disc pl-5 space-y-1 text-blue-700">
              <li>Perubahan iklim didorong emisi gas rumah kaca (CO2, CH4, N2O).</li>
              <li>Siklus hidup perangkat elektronik berkontribusi ~948 kg CO2 per perangkat (Andrae & Edler, 2015).</li>
              <li>Komitmen Indonesia (Paris Agreement): Target penurunan emisi 29-41% pada 2030.</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Konteks Studi Kasus (ITB)</h3>
            <ul className="list-disc pl-5 space-y-1 text-green-700">
              <li>Peningkatan penggunaan perangkat elektronik di seluruh area kampus.</li>
              <li>Belum adanya sistem terintegrasi untuk pemantauan emisi karbon.</li>
              <li>Perhitungan manual tidak efisien dan memakan waktu.</li>
              <li>Rendahnya kesadaran mengenai dampak konsumsi energi perangkat.</li>
            </ul>
          </div>
        </div>
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-800 mb-2">Identifikasi Kesenjangan Kunci</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Perangkat yang digunakan belum sepenuhnya didesain untuk efisiensi energi.</li>
            <li>Sumber listrik utama berasal dari energi tidak terbarukan (batu bara).</li>
            <li>Belum ada pemantauan emisi karbon secara real-time.</li>
            <li>Platform yang ada (Elisa) hanya menyajikan data konsumsi listrik (kWh), belum ada fitur konversi dan visualisasi emisi karbon.</li>
          </ol>
        </div>
      </div>
    ),
    icon: LightBulbIcon,
  },
  {
    title: "Rumusan Masalah & Tujuan Penelitian",
    content: (
      <div className="space-y-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h3 className="text-xl font-bold text-red-700 mb-2">Rumusan Masalah</h3>
          <p className="text-red-700">
            Belum adanya aplikasi frontend untuk memvisualisasikan data emisi karbon dari penggunaan perangkat elektronik di Kampus ITB Ganesha, yang menghambat upaya pemantauan dan keberlanjutan.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-4">Tujuan Penelitian</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Mengembangkan frontend berbasis web untuk visualisasi emisi karbon",
              "Menghitung emisi dari penggunaan perangkat elektronik",
            ].map((item, index) => (
              <div key={index} className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-white mt-0.5 mr-2 flex-shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Ruang Lingkup Penelitian",
    content: (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-lg text-blue-700 mb-3">Batasan Penelitian</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <span className="font-semibold">Lingkup Geografis:</span> Terbatas pada lingkungan Kampus ITB Ganesha.
            </li>
            <li>
              <span className="font-semibold">Lingkup Teknis:</span> Fokus hanya pada pengembangan frontend (Next.js + Recharts).
            </li>
            <li>
              <span className="font-semibold">Lingkup Data:</span> Hanya emisi dari penggunaan perangkat elektronik (Scope 2 - Konsumsi Listrik).
            </li>
            <li>
              <span className="font-semibold">Lingkup Fungsional:</span> Visualisasi dan pemantauan, bukan strategi pengurangan emisi.
            </li>
          </ol>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-800 mb-2">Cakupan Protokol GHG</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { scope: "Scope 1", desc: "Emisi Langsung (tidak termasuk)", color: "bg-gray-200 text-gray-800" },
              { scope: "Scope 2", desc: "Konsumsi Listrik (termasuk)", color: "bg-green-200 text-green-800" },
              { scope: "Scope 3", desc: "Emisi Tidak Langsung Lainnya (tidak termasuk)", color: "bg-gray-200 text-gray-800" }
            ].map((item, index) => (
              <div key={index} className={`${item.color} px-4 py-2 rounded-lg`}>
                <span className="font-medium">{item.scope}:</span> {item.desc}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    icon: AcademicCapIcon,
  },
  {
    title: "Metodologi",
    content: (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-lg text-blue-700 mb-3">Software Development Life Cycle (SDLC)</h3>
          <ol className="list-decimal pl-5 space-y-3">
            <li>
              <span className="font-semibold">Analisis Kebutuhan:</span> Wawancara dengan stakeholder ITB (SPSI), studi literatur.
            </li>
            <li>
              <span className="font-semibold">Perancangan Perangkat Lunak:</span> Desain UI/UX, pemilihan teknologi (Metode TOPSIS).
            </li>
            <li>
              <span className="font-semibold">Implementasi:</span> Pengembangan frontend dengan Next.js dan Recharts.
            </li>
            <li>
              <span className="font-semibold">Pengujian:</span> Pengujian Fungsional dan User Acceptance Testing (UAT).
            </li>
          </ol>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Proses Pemilihan Teknologi (Hasil TOPSIS)</h3>
          <p className="text-blue-700">
            Menggunakan metode TOPSIS untuk evaluasi alternatif. Next.js+Recharts terpilih sebagai solusi optimal dengan skor preferensi 0.629.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-blue-100">
                <tr>
                  <th className="p-2 font-medium">Kriteria</th>
                  <th className="p-2 font-medium text-center">Next.js</th>
                  <th className="p-2 font-medium text-center">Vue.js</th>
                  <th className="p-2 font-medium text-center">Python</th>
                  <th className="p-2 font-medium text-center">Tableau</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Kecepatan Pengembangan</td>
                  <td className="p-2 text-center text-green-600 font-bold">85</td>
                  <td className="p-2 text-center">50</td>
                  <td className="p-2 text-center">30</td>
                  <td className="p-2 text-center">100</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Dokumentasi</td>
                  <td className="p-2 text-center text-green-600 font-bold">100</td>
                  <td className="p-2 text-center">80</td>
                  <td className="p-2 text-center">40</td>
                  <td className="p-2 text-center">50</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Kustomisasi</td>
                  <td className="p-2 text-center">80</td>
                  <td className="p-2 text-center text-green-600 font-bold">100</td>
                  <td className="p-2 text-center">40</td>
                  <td className="p-2 text-center">30</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Kinerja</td>
                  <td className="p-2 text-center text-green-600 font-bold">90</td>
                  <td className="p-2 text-center text-green-600 font-bold">90</td>
                  <td className="p-2 text-center">60</td>
                  <td className="p-2 text-center">80</td>
                </tr>
                <tr>
                  <td className="p-2">Kurva Belajar (Cost)</td>
                  <td className="p-2 text-center">60</td>
                  <td className="p-2 text-center">90</td>
                  <td className="p-2 text-center text-green-600 font-bold">40</td>
                  <td className="p-2 text-center text-green-600 font-bold">10</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    ),
    icon: ClipboardDocumentListIcon,
  },
  {
    title: "Fitur & Kebutuhan Sistem",
    content: (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Fitur Visualisasi",
              items: [
                "Total emisi kampus (FR01, FR02)",
                "Emisi per gedung (FR03)",
                "Emisi per ruangan (FR04)",
                "Perangkat emitor teratas (FR05)",
                "Filter periode waktu (FR06)"
              ]
            },
            {
              title: "Fitur Manajemen Data",
              items: [
                "Tambah data perangkat (FR09)",
                "Ubah data perangkat (FR10)",
                "Hapus data perangkat (FR11)",
                "Role-Based Access Control (FR07, FR08)"
              ]
            }
          ].map((feature, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
              <h3 className="font-semibold text-lg text-blue-700 mb-3">{feature.title}</h3>
              <ul className="space-y-2">
                {feature.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-2">Kebutuhan Non-Fungsional (NFR)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: "NFR01", req: "Usability: Antarmuka intuitif dan mudah digunakan." },
              { id: "NFR02", req: "Maintainability: Arsitektur modular agar mudah diperbarui." },
              { id: "NFR03", req: "Performance: Waktu render UI maksimal 5 detik." }
            ].map((item, index) => (
              <div key={index} className="bg-white p-3 rounded shadow">
                <span className="font-medium text-blue-600">{item.id}:</span> {item.req}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    icon: ChartBarIcon,
  },
  {
    title: "Desain & Arsitektur Sistem",
    content: (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-lg text-blue-700 mb-3">Use Case Diagram</h3>
          <p className="mb-4">Sistem melibatkan 3 aktor utama dengan hak akses yang berbeda:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { role: "Admin", desc: "Manajemen pengguna & seluruh operasi data." },
              { role: "Operator", desc: "Tambah/Ubah/Hapus data perangkat." },
              { role: "Pengguna Umum", desc: "Melihat visualisasi dashboard." }
            ].map((item, index) => (
              <div key={index} className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-semibold text-blue-800">{item.role}</h4>
                <p className="text-blue-700">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-gray-100 p-4 rounded-lg text-center text-gray-500">
            <Image 
              src="/diagram-use-case.png"
              alt="Diagram Use Case Sistem" 
              width={700} 
              height={400} 
              className="mx-auto rounded-md"
            />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Arsitektur Teknis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium">Frontend Stack:</h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Next.js (React framework)</li>
                <li>TypeScript</li>
                <li>Recharts (Visualisasi Data)</li>
                <li>Tailwind CSS (Styling)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Integrasi Backend:</h4>
              <ul className="list-disc pl-5 mt-2">
                <li>Konsumsi REST API untuk data</li>
                <li>Autentikasi berbasis JWT</li>
                <li>Role-Based Access Control</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
    icon: CpuChipIcon,
  },
  {
    title: "Hasil Implementasi",
    content: (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-3">Hasil Kunci Implementasi</h3>
          <ul className="list-disc pl-5 space-y-2 marker:text-white">
            <li>Aplikasi frontend berhasil dikembangkan menggunakan Next.js dan Recharts.</li>
            <li>Seluruh 11 kebutuhan fungsional telah berhasil diimplementasikan.</li>
            <li>Visualisasi interaktif (grafik garis, pai, batang dengan drill-down) berfungsi.</li>
            <li>Sistem Role-Based Access Control telah diimplementasikan.</li>
            <li>Fungsi pemfilteran data berdasarkan waktu berjalan sesuai harapan.</li>
          </ul>
        </div>
        
        <div className="mt-6 bg-gray-100 p-4 rounded-lg text-center">
            <Image 
              src="/carbon-dashboard.png"
              alt="Screenshot Dashboard Aplikasi" 
              width={800} 
              height={450} 
              className="mx-auto rounded-md shadow-lg"
            />
            <p className="mt-2 text-sm text-gray-600">Tampilan dashboard utama dengan berbagai visualisasi emisi dan opsi filter.</p>
        </div>
      </div>
    ),
    icon: CheckCircleIcon,
  },
  {
    title: "Hasil Pengujian & Validasi",
    content: (
      <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Hasil Pengujian Fungsional (Blackbox)</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span><span className="font-semibold">10 dari 10 skenario pengujian berhasil</span> dan dinyatakan <span className="font-semibold">LULUS</span>.</span>
              </li>
               <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Sistem terbukti telah memenuhi seluruh kebutuhan fungsional yang ditetapkan.</span>
              </li>
            </ul>
          </div>
          <div className="bg-green-50 p-5 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-3">Hasil UAT (User Experience Questionnaire)</h4>
             <ul className="space-y-2">
               <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Responden: 9 pengguna (2 admin, 7 mahasiswa).</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Semua 6 aspek kualitas (Attractiveness, Perspicuity, dll.) berada dalam <span className="font-semibold">rentang positif</span>.</span>
              </li>
               <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <span>Menegaskan bahwa sistem diterima dengan baik oleh target pengguna.</span>
              </li>
            </ul>
          </div>
        </div>
         <div className="mt-6 bg-gray-100 p-4 rounded-lg text-center">
            <Image 
              src="/hasil-ueq.png"
              alt="Grafik Hasil Pengujian UEQ" 
              width={600} 
              height={300} 
              className="mx-auto rounded-md"
            />
            <p className="mt-2 text-sm text-gray-600">Diagram hasil pengujian UEQ yang menunjukkan skor positif pada semua skala.</p>
        </div>
      </div>
    ),
    icon: CheckCircleIcon,
  },
  {
    title: "Kesimpulan & Saran Pengembangan",
    content: (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h3 className="font-bold text-lg text-blue-700 mb-3">Kesimpulan</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>Aplikasi frontend untuk visualisasi emisi karbon telah berhasil dikembangkan secara fungsional.</li>
            <li>Aplikasi telah memenuhi seluruh kebutuhan fungsional dan non-fungsional yang telah ditetapkan.</li>
            <li>Menyediakan alat bantu yang berharga bagi ITB untuk mendukung inisiatif keberlanjutan dan kontribusi pada SDGs.</li>
            <li>Telah divalidasi melalui pengujian komprehensif dengan hasil dan umpan balik pengguna yang sangat positif.</li>
          </ul>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="font-bold text-lg text-blue-700 mb-3">Saran Pengembangan Lanjutan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                category: "Peningkatan Teknis",
                items: [
                  "Implementasi desain yang responsif untuk perangkat mobile.",
                  "Integrasi data real-time dengan sensor IoT.",
                  "Penambahan jenis visualisasi tingkat lanjut (contoh: heat maps)."
                ]
              },
              {
                category: "Perluasan Lingkup",
                items: [
                  "Mencakup kampus ITB lainnya (Jatinangor, Cirebon).",
                  "Menambahkan kalkulasi emisi Scope 1 dan Scope 3.",
                  "Integrasi dengan sistem internal ITB yang sudah ada."
                ]
              },
            ].map((item, index) => (
              <div key={index} className="bg-white p-3 rounded shadow">
                <h4 className="font-semibold text-blue-800 mb-2">{item.category}</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {item.items.map((subItem, subIndex) => (
                    <li key={subIndex} className="text-sm">{subItem}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    icon: AcademicCapIcon,
  },
];


export default function PresentationPage() {
  return (
    <>
      <Head>
        <title>Presentasi Sidang Akhir | Visualisasi Emisi Karbon ITB</title>
        <meta name="description" content="Presentasi sidang tugas akhir untuk Pengembangan Frontend Aplikasi Website untuk Visualisasi Emisi Karbon" />
      </Head>

      <Layout>
        <main className="bg-gray-50 min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-12">
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
              >
                Presentasi Sidang Tugas Akhir
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-4 text-xl text-gray-600"
              >
                Pengembangan Frontend Aplikasi Website untuk Visualisasi Emisi Jejak Karbon
              </motion.p>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-2 text-lg text-gray-500"
              >
                Studi Kasus: Kampus ITB Ganesha
              </motion.p>
            </div>

            <div className="space-y-20">
              {slides.map((slide, index) => (
                <motion.section
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-indigo-600">
                    <div className="bg-white p-6 sm:p-8 md:p-10">
                      <div className="flex items-center mb-6">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-600">
                          <slide.icon className="h-6 w-6" />
                        </div>
                        <h2 className="ml-4 text-2xl font-bold text-gray-900">
                          {slide.title}
                        </h2>
                      </div>
                      <div className="prose prose-lg max-w-none text-gray-700">
                        {slide.content}
                      </div>
                    </div>
                  </div>
                </motion.section>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-20 text-center"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Terima Kasih</h2>
              <p className="text-xl text-gray-600 mb-8">
                Sesi Tanya Jawab & Diskusi
              </p>
              <div className="flex justify-center space-x-4">
                <a
                  href="https://itb-carbon-emission-frontend.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Lihat Dashboard Live
                </a>
              </div>
            </motion.div>
          </div>
        </main>
      </Layout>
    </>
  );
}