// pages/login.tsx
"use client";

import { useState, useEffect } from "react"; // Ganti useState dari React menjadi useEffect jika perlu
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link"; // Tetap ada untuk "Forgot Password"
import { useAuth } from "@/contexts/AuthContext";

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
  const searchParams = useSearchParams();
  const auth = useAuth();

  // Menggunakan useEffect untuk side effect setelah render
  useEffect(() => {
    const redirectMsg = searchParams.get('message');
    if (redirectMsg && !message) { // Hanya set jika message belum ada, untuk menghindari overwrite
        setMessage(`ℹ️ ${decodeURIComponent(redirectMsg)}`);
    }
    if (auth.isAuthenticated && !auth.isLoading) { // Cek juga !auth.isLoading
        const redirectTo = searchParams.get('redirectTo');
        console.log(`Already authenticated, redirecting to: ${redirectTo || '/'}`);
        router.replace(redirectTo || '/');
    }
  }, [auth.isAuthenticated, auth.isLoading, searchParams, router, message]); // Tambah message ke dependency


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... sama ... */ setForm({...form,[e.target.name]:e.target.value});setMessage("");};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage(data.error || "❌ Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      setMessage("✅ Login successful! Redirecting...");
      // Pastikan API login mengembalikan userId dan role (jika ada)
      // Untuk contoh, kita hardcode role admin jika login berhasil, backend harusnya yang menentukan
      const userData = {
          id: data.userId,
          email: form.username,
          role: data.role || (form.username.includes("admin") ? "admin" : "user") // INI HANYA CONTOH, AMBIL ROLE DARI API
      };
      auth.login(data.token, userData);

    } catch (err: any) {setMessage("❌ Network or server error: " + err.message); setLoading(false);}
  };

  const handleForgotSubmit = async () => { /* ... sama ... */ setForgotMsg("");setForgotLoading(true);try{const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000"}/users/forgot-password`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:forgotEmail}),});const data=await res.json();if(!res.ok){setForgotMsg(data.message||"❌ Failed to send reset link.");if(res.status!==200&&data.error){setForgotMsg(`❌ ${data.error}`)}return}setForgotMsg(data.message||"✅ If an account exists, a reset link has been sent.")}catch(err:any){setForgotMsg("❌ Error: "+err.message)}finally{setForgotLoading(false)}};

  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Loading authentication...</p></div>;
  }

  // Jika sudah login, idealnya tidak akan sampai sini karena redirect di useEffect
  if (auth.isAuthenticated) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Redirecting...</p></div>;
  }

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-6 relative" style={{ backgroundImage: "url('/bg-itb2.jpg')" }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <form onSubmit={handleSubmit} className="relative bg-white/70 backdrop-blur-md p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">Login</h2>
        {/* Input Email */}
        <label className="block mb-2 text-sm text-gray-800">Email</label>
        <input type="email" name="username" value={form.username} onChange={handleChange} className="w-full mb-4 border rounded p-2 text-gray-800" placeholder="you@example.com" required />
        {/* Input Password */}
        <label className="block mb-2 text-sm text-gray-800">Password</label>
        <div className="relative mb-4">
          <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className="w-full border rounded p-2 text-gray-800 pr-10" placeholder="Enter your password" required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1" aria-label="Toggle password visibility">
            <img src={showPassword ? "/hide-password.png" : "/show-password.png"} alt="toggle password visibility" className="w-5 h-5 opacity-70 hover:opacity-100 transition" />
          </button>
        </div>
        {/* Tombol Forgot Password (Link Register Dihapus) */}
        <div className="flex justify-end items-center mb-3">
          <button type="button" onClick={() => { setForgotEmail(""); setForgotMsg(""); setShowForgot(true); }} className="text-xs text-gray-800 hover:underline">
            Forgot Password?
          </button>
        </div>
        <button type="submit" disabled={loading} className="w-full bg-[#0078d7] hover:bg-[#005fa3] text-white font-semibold py-2 px-4 rounded transition-colors">
          {loading ? "Logging in..." : "Login"}
        </button>
        {message && <p className="mt-4 text-sm text-center text-gray-800">{message}</p>}
      </form>
      {/* Modal Forgot Password (sama) */}
      {showForgot&&(<div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4"><div className="bg-white p-6 rounded shadow-md w-full max-w-md"><h3 className="text-xl font-bold text-gray-800 mb-4">Forgot Password</h3><input type="email"value={forgotEmail}onChange={(e)=>setForgotEmail(e.target.value)}className="w-full border rounded p-2 mb-4 text-gray-800"placeholder="Enter your email"/><div className="flex justify-end gap-2"><button type="button"onClick={()=>setShowForgot(false)}className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100">Cancel</button><button type="button"onClick={handleForgotSubmit}className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"disabled={forgotLoading}>{forgotLoading?"Sending...":"Send Link"}</button></div>{forgotMsg&&<p className="mt-3 text-sm text-center text-gray-800">{forgotMsg}</p>}</div></div>)}
    </div>
  );
}