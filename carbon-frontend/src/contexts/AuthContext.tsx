// src/contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Gunakan next/navigation untuk App Router

// Definisikan email super admin di satu tempat yang terpusat
const SUPER_ADMIN_EMAIL = "carbonemissiondashboarda@gmail.com";

interface UserData {
  id: string;
  email: string;
  role?: string;
}

// BARU: Perbarui interface untuk menyertakan isSuperAdmin
interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean; // State baru untuk Super Admin
  user: UserData | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false); // BARU: Tambahkan state
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log("[AuthContext] Initializing auth state...");
    const token = localStorage.getItem('authToken');
    const storedUserString = localStorage.getItem('authUser');
    if (token && storedUserString) {
      try {
        const storedUser: UserData = JSON.parse(storedUserString);
        
        // UBAH: Hitung semua role di sini
        const isUserSuperAdmin = storedUser.email === SUPER_ADMIN_EMAIL;
        const isUserAdmin = storedUser.role === 'admin' || isUserSuperAdmin;

        setUser(storedUser);
        setIsAuthenticated(true);
        setIsAdmin(isUserAdmin);
        setIsSuperAdmin(isUserSuperAdmin); // Set state super admin

        console.log(`[AuthContext] User restored: ${storedUser.email}, IsAdmin: ${isUserAdmin}, IsSuperAdmin: ${isUserSuperAdmin}`);
      } catch (e) {
        console.error("[AuthContext] Failed to parse stored user.", e);
        // Hapus data yang rusak
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: UserData) => {
    // UBAH: Hitung semua role saat login
    const isUserSuperAdmin = userData.email === SUPER_ADMIN_EMAIL;
    const isUserAdmin = userData.role === 'admin' || isUserSuperAdmin;

    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(isUserAdmin);
    setIsSuperAdmin(isUserSuperAdmin); // Set state super admin

    console.log(`[AuthContext] User logged in: ${userData.email}, IsAdmin: ${isUserAdmin}, IsSuperAdmin: ${isUserSuperAdmin}`);

    const searchParams = new URLSearchParams(window.location.search);
    const redirectTo = searchParams.get('redirectTo');
    router.push(redirectTo || '/');
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
    setIsSuperAdmin(false); // BARU: Reset state super admin saat logout
    console.log("[AuthContext] User logged out.");
  };

  return (
    // BARU: Kirim isSuperAdmin ke semua komponen anak
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, isSuperAdmin, user, login, logout, isLoading }}>
      {/* Jangan render children jika masih loading untuk mencegah "blink" halaman yang dilindungi */}
      {!isLoading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};