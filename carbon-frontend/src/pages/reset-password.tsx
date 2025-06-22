"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    const accessToken = new URLSearchParams(hash.replace("#", "")).get("access_token");

    if (accessToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: "" })
        .then(async () => {
          const { data, error } = await supabase.auth.getUser();
          if (error || !data?.user?.email) {
            setMessage("❌ Failed to get user info from token.");
          } else {
            setEmail(data.user.email);
          }
          setLoading(false);
        });
    } else {
      setMessage("❌ Invalid reset link.");
      setLoading(false);
    }
  }, []);

  const handlePasswordReset = async () => {
    setMessage("");

    if (password.length < 6) {
      setMessage("❌ Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword: password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Reset failed");

      setMessage("✅ Password updated! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setMessage("❌ Failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Reset Password</h2>

        {loading ? (
          <p className="text-center text-gray-700">Loading user info...</p>
        ) : (
          <>
            <p className="text-sm text-center text-gray-700 mb-3">
              Reset password for <strong>{email}</strong>
            </p>

            {/* Password input */}
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border px-3 py-2 rounded text-gray-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <img
                  src={showPassword ? "/hide-password.png" : "/show-password.png"}
                  alt="toggle password"
                  className="w-5 h-5 opacity-70 hover:opacity-100 transition"
                />
              </button>
            </div>

            {/* Confirm password input */}
            <div className="relative mb-4">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full border px-3 py-2 rounded text-gray-800 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <img
                  src={showConfirm ? "/hide-password.png" : "/show-password.png"}
                  alt="toggle confirm password"
                  className="w-5 h-5 opacity-70 hover:opacity-100 transition"
                />
              </button>
            </div>

            <button
              onClick={handlePasswordReset}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
              Update Password
            </button>
          </>
        )}

        {message && (
          <p className="mt-4 text-sm text-center text-gray-800">{message}</p>
        )}
      </div>
    </div>
  );
}
