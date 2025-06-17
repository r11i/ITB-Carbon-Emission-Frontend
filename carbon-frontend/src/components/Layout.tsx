// src/components/Layout.tsx

import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  /**
   * Jika true, hapus padding vertikal dan horizontal.
   * Berguna untuk halaman yang membutuhkan kontrol penuh atas layoutnya, seperti peta.
   */
  noPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noPadding = false }) => {
  return (
    // Background utama untuk seluruh aplikasi
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Kontainer utama. Padding akan diterapkan di sini kecuali noPadding=true */}
      <main className={noPadding ? "" : "px-4 sm:px-6 lg:px-8 py-6 sm:py-8"}>
        {children}
      </main>
    </div>
  );
};

export default Layout;