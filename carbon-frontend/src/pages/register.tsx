// pages/register.tsx (User Management Page for Admin)
"use client"; // Jika Anda menggunakan App Router, jika Pages Router, ini tidak perlu

import { useState, useEffect } from "react";
import { useRouter } from "next/router"; // Gunakan next/router untuk Pages Router
import Link from "next/link"; // Mungkin tidak perlu jika admin tidak register dirinya sendiri
import { useAuth } from "@/contexts/AuthContext";

export default function AdminUserRegisterPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();

  // Proteksi Route
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || !isAdmin) {
        router.replace("/login?message=Admin access required for user management.");
      }
    }
  }, [isAuthenticated, isAdmin, isAuthLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (form.password.length < 6) {
      setMessage("❌ Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
          setMessage("❌ Admin not authenticated. Please login again.");
          setLoading(false);
          // Mungkin redirect ke login admin
          return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` // KIRIM TOKEN ADMIN
        },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(`❌ Failed: ${data.error || "Could not register user."}`);
      } else {
        setMessage(`✅ User ${form.username} registered successfully!`);
        setForm({ username: "", password: "" }); // Reset form
      }
    } catch (err: any) {
      setMessage("❌ Network or server error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>;
  }
  if (!isAuthenticated || !isAdmin) {
    // Ini fallback jika redirect belum terjadi
    return <div className="min-h-screen flex items-center justify-center"><p>Access Denied. Redirecting...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center pt-10 p-6">
      <div className="w-full max-w-md mb-6">
        <Link href="/" legacyBehavior>
            <a className="text-blue-600 hover:text-blue-800">← Back to Dashboard</a>
        </Link>
      </div>
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Register New User (Admin)</h2>
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm text-gray-800">New User's Email</label>
          <input type="email" name="username" value={form.username} onChange={handleChange} className="w-full mb-4 border rounded p-2 text-gray-800" placeholder="newuser@example.com" required />
          <label className="block mb-2 text-sm text-gray-800">New User's Password</label>
          <div className="relative mb-4">
            <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className="w-full border rounded p-2 text-gray-800 pr-10" placeholder="Minimum 6 characters" required />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
              <img src={showPassword ? "/hide-password.png" : "/show-password.png"} alt="toggle password" className="w-5 h-5 opacity-70" />
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded transition-colors">
            {loading ? "Registering..." : "Register User"}
          </button>
          {message && <p className="mt-4 text-sm text-center text-gray-800">{message}</p>}
        </form>
      </div>
    </div>
  );
}