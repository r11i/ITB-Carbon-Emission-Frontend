"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserRegisterForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("email already in use")) {
          setMessage("❌ Email already in use. Please login instead.");
        } else if (data.error?.toLowerCase().includes("user not allowed")) {
          setMessage("❌ Email already in use or not verified. Please login.");
        } else {
          setMessage("❌ Failed: " + data.error);
        }
        return;
      }

      if (form.password.length < 6) {
        setMessage("❌ Password must be at least 6 characters long.");
        return;
      }

      setMessage("✅ Registration successful! Please login.");
      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (err: any) {
      setMessage("❌ Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-6 relative"
      style={{ backgroundImage: "url('/bg-itb2.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative bg-white/70 backdrop-blur-md p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Register</h2>

        <label className="block mb-2 text-sm text-gray-800">Email</label>
        <input
          type="email"
          name="username"
          value={form.username}
          onChange={handleChange}
          className="w-full mb-4 border rounded p-2 text-gray-800"
          placeholder="you@example.com"
        />

        <label className="block mb-2 text-sm text-gray-800">Password</label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border rounded p-2 text-gray-800 pr-10"
            placeholder="Minimum 6 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <img
              src={showPassword ? "/hide-password.png" : "/show-password.png"}
              alt="toggle password visibility"
              className="w-5 h-5 opacity-70 hover:opacity-100 transition"
            />
          </button>
        </div>

        <p className="text-xs text-gray-700 mb-3 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#0078d7] hover:bg-[#005fa3] text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? "Please Wait..." : "Register"}
        </button>

        {message && <p className="mt-4 text-sm text-center text-gray-800">{message}</p>}
      </div>
    </div>
  );
}
