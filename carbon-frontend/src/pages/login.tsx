"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserLoginForm() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:5000/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error.toLowerCase().includes("invalid login credentials")) {
          setMessage("❌ Account not found. Please register first.");
        } else {
          setMessage("❌ Login failed. Please check your credentials.");
        }
        return;
      }

      setMessage("✅ Login successful! Redirecting...");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (err: any) {
      setMessage("❌ Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    setForgotMsg("");
    setForgotLoading(true);
    try {
      const res = await fetch("http://localhost:5000/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes("not registered")) {
          setForgotMsg("❌ Email is not registered.");
        } else {
          setForgotMsg("❌ Failed to send reset link.");
        }
        return;
      }

      setForgotMsg("✅ Reset link sent to your email.");
    } catch (err: any) {
      setForgotMsg("❌ Error: " + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-6 relative"
      style={{ backgroundImage: "url('/bg-itb2.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div className="relative bg-white/70 backdrop-blur-md p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Login</h2>

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
            placeholder="Enter your password"
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

        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-gray-700">
            Don't have an account?{" "}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
          <button
            type="button"
            onClick={() => {
              setForgotEmail("");
              setForgotMsg("");
              setShowForgot(true);
            }}
            className="text-xs text-gray-800 hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#0078d7] hover:bg-[#005fa3] text-white font-semibold py-2 px-4 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {message && <p className="mt-4 text-sm text-center text-gray-800">{message}</p>}
      </div>

      {/* Modal Forgot Password */}
      {showForgot && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Forgot Password</h3>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="w-full border rounded p-2 mb-4 text-gray-800"
              placeholder="Enter your email"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForgot(false)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={forgotLoading}
              >
                {forgotLoading ? "Sending..." : "Send Link"}
              </button>
            </div>
            {forgotMsg && <p className="mt-3 text-sm text-center text-gray-800">{forgotMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
