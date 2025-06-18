// src/components/Navbar.tsx
"use client"; 

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

// --- Data Navigasi (tidak ada perubahan) ---
const navItems = [
  { name: "Map View", href: "/" },
  { name: "Dashboard", href: "/carbon-dashboard" },
  { name: "Input", href: "/device-table", auth: true },
  { name: "About", href: "/about" },
];

const ADMIN_EMAIL = "carbonemissiondashboarda@gmail.com";

// --- Komponen Dropdown Item (tidak ada perubahan) ---
interface DropdownItemProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}
const DropdownItem: React.FC<DropdownItemProps> = ({ href, onClick, children }) => {
  const classNames = "block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors";
  if (href) {
    return <Link href={href} legacyBehavior><a className={classNames}>{children}</a></Link>;
  }
  return <button onClick={onClick} className={classNames}>{children}</button>;
};


// --- Komponen Navbar Utama ---
const Navbar = () => {
  const pathname = usePathname(); 
  const { isAuthenticated, user, logout } = useAuth();
  const isSuperAdmin = isAuthenticated && user?.email === ADMIN_EMAIL;

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileNavOpen(false);
  };
  
  const handleMobileLinkClick = () => {
    setIsMobileNavOpen(false);
  }

  return (
    <>
      <nav className="bg-white/80 backdrop-blur-md shadow-sm z-50 sticky top-0 h-16 border-b border-slate-200/80">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Left Section */}
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsMobileNavOpen(true)} className="md:hidden p-2 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Open navigation menu">
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
              <Link href="/" legacyBehavior>
                <a className="flex-shrink-0 flex items-center space-x-3">
                  <img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" />
                  <h1 className="text-xl font-bold text-slate-800 hidden sm:block">ITB Carbon Footprint</h1>
                  <h1 className="text-lg font-bold text-slate-800 block sm:hidden">ITB Carbon</h1>
                </a>
              </Link>
            </div>

            {/* Center/Desktop Navigation with Animation */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {navItems.map((item) => (
                (item.auth && !isAuthenticated) ? null : (
                  <Link href={item.href} key={item.name} legacyBehavior>
                    <a className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pathname === item.href ? 'text-blue-600' : 'text-slate-600 hover:text-blue-600'
                    }`}>
                      {pathname === item.href && (
                        <motion.div
                          layoutId="active-pill"
                          className="absolute inset-0 bg-blue-100 rounded-md z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{item.name}</span>
                    </a>
                  </Link>
                )
              ))}
            </div>

            {/* Right Section (DENGAN PERUBAHAN) */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {isAuthenticated ? (
                <div className="relative">
                  {/* PERUBAHAN ADA DI DALAM TOMBOL INI */}
                  <button onClick={() => setIsUserDropdownOpen(prev => !prev)} className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 pl-2 pr-3 py-1.5 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    {/* IKON PROFIL DITAMBAHKAN DI SINI */}
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </span>
                    
                    {/* Nama pengguna */}
                    {user?.email ? user.email.split('@')[0] : "Menu"}
                    
                    {/* Ikon panah dropdown */}
                    <svg className={`ml-2 h-4 w-4 transition-transform duration-200 ${isUserDropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  </button>
                  {isUserDropdownOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-40" onMouseLeave={() => setIsUserDropdownOpen(false)}>
                      {isSuperAdmin && <DropdownItem href="/register">User Management</DropdownItem>}
                      <DropdownItem onClick={logout}>Logout</DropdownItem>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" legacyBehavior>
                  <a className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">Login</a>
                </Link>
              )}
            </div>
            <div className="md:hidden flex-shrink-0" />
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Panel (tidak ada perubahan) */}
      {isMobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75" onClick={() => setIsMobileNavOpen(false)} aria-hidden="true" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setIsMobileNavOpen(false)}>
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4"><img className="h-8 w-auto" src="/logo-itb.svg" alt="ITB Logo" /><span className="ml-3 text-xl font-bold text-gray-900">ITB Carbon</span></div>
              <nav className="mt-6 px-2 space-y-1">
                {navItems.map(item => (
                  (item.auth && !isAuthenticated) ? null : (
                    <Link href={item.href} key={item.name} legacyBehavior>
                        <a onClick={handleMobileLinkClick} className={`group flex items-center px-3 py-3 text-base font-medium rounded-md ${
                            pathname === item.href ? 'text-blue-600 bg-blue-100' : 'text-gray-900 hover:bg-blue-50 hover:text-blue-600'
                        }`}>{item.name}</a>
                    </Link>
                  )
                ))}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  {isAuthenticated ? (
                    <>
                      {isSuperAdmin && <Link href="/register" legacyBehavior><a onClick={handleMobileLinkClick} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">User Management</a></Link>}
                      <button onClick={handleLogout} className="w-full text-left group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-red-50 hover:text-red-600">Logout {user?.email ? `(${user.email.split('@')[0]})` : ''}</button>
                    </>
                  ) : (
                    <Link href="/login" legacyBehavior><a onClick={handleMobileLinkClick} className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 hover:text-blue-600">Login</a></Link>
                  )}
                </div>
              </nav>
            </div>
          </div>
          <div className="flex-shrink-0 w-14" />
        </div>
      )}
    </>
  );
};

export default Navbar;