import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, noPadding = false }) => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className={noPadding ? "" : "px-4 sm:px-6 lg:px-8 py-6 sm:py-8"}>
        {children}
      </main>
    </div>
  );
};

export default Layout;