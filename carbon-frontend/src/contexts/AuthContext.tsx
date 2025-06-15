// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation'; // Untuk App Router. Ganti ke 'next/router' jika Pages Router

interface UserData {
  id: string;
  email: string;
  role?: string; // Role akan diisi dari API login
}

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean; // Ditentukan berdasarkan user.role === 'admin'
  user: UserData | null;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // atau use useRouter dari 'next/router' jika Pages Router
  const pathname = usePathname(); // atau router.pathname jika Pages Router

  useEffect(() => {
    console.log("[AuthContext] Initializing auth state...");
    const token = localStorage.getItem('authToken');
    const storedUserString = localStorage.getItem('authUser');
    if (token && storedUserString) {
      try {
        const storedUser: UserData = JSON.parse(storedUserString);
        setUser(storedUser);
        setIsAuthenticated(true);
        setIsAdmin(storedUser.role === 'admin');
        console.log("[AuthContext] User restored from localStorage:", storedUser, "IsAdmin:", storedUser.role === 'admin');
      } catch (e) {
        console.error("[AuthContext] Failed to parse stored user, clearing auth state.", e);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    } else {
        console.log("[AuthContext] No token or user found in localStorage.");
    }
    setIsLoading(false);
  }, []);

  const login = (token: string, userData: UserData) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(userData.role === 'admin');
    console.log("[AuthContext] User logged in:", userData, "IsAdmin:", userData.role === 'admin');

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
    console.log("[AuthContext] User logged out.");
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, logout, isLoading }}>
      {!isLoading ? children : null}
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