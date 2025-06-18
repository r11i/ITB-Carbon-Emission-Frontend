"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar"; // LANGKAH 1: Impor komponen Navbar

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

  // useEffect dan fungsi lainnya (handleChange, handleSubmit, dll) tidak diubah
  useEffect(() => {
    const redirectMsg = searchParams.get('message');
    if (redirectMsg && !message) {
        setMessage(`ℹ️ ${decodeURIComponent(redirectMsg)}`);
    }
    if (auth.isAuthenticated && !auth.isLoading) {
        const redirectTo = searchParams.get('redirectTo');
        console.log(`Already authenticated, redirecting to: ${redirectTo || '/'}`);
        router.replace(redirectTo || '/');
    }
  }, [auth.isAuthenticated, auth.isLoading, searchParams, router, message]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setForm({...form,[e.target.name]:e.target.value});setMessage("");};
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
      const userData = {
          id: data.userId,
          email: form.username,
          role: data.role || (form.username.includes("admin") ? "admin" : "user")
      };
      auth.login(data.token, userData);
    } catch (err: any) {setMessage("❌ Network or server error: " + err.message); setLoading(false);}
  };
  const handleForgotSubmit = async () => { setForgotMsg("");setForgotLoading(true);try{const res=await fetch(`${process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000"}/users/forgot-password`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:forgotEmail}),});const data=await res.json();if(!res.ok){setForgotMsg(data.message||"❌ Failed to send reset link.");if(res.status!==200&&data.error){setForgotMsg(`❌ ${data.error}`)}return}setForgotMsg(data.message||"✅ If an account exists, a reset link has been sent.")}catch(err:any){setForgotMsg("❌ Error: "+err.message)}finally{setForgotLoading(false)}};

  if (auth.isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Loading authentication...</p></div>;
  }
  if (auth.isAuthenticated) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Redirecting...</p></div>;
  }

  return (
    // LANGKAH 2: Bungkus semua dengan div flex-col setinggi layar.
    // Ini akan menempatkan Navbar di atas dan konten utama di bawahnya.
    <div className="flex flex-col  min-h-screen bg-slate-50">
      <Navbar />

      {/* LANGKAH 3: Area konten utama dibuat fleksibel untuk mengisi sisa ruang.
          Styling background dan centering dipindahkan ke sini. */}
      <main className="flex-grow flex items-center justify-center p-6 relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-itb2.jpg')" }}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        {/* Form login tidak berubah, hanya posisinya yang disesuaikan oleh parent <main> */}
        <div className="relative z-10 w-full max-w-sm">
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg w-full">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Login</h2>
                
                <div className="mb-4">
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Email</label>
                    <input type="email" name="username" value={form.username} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="you@example.com" required />
                </div>

                <div className="mb-4">
                    <label className="block mb-1.5 text-sm font-medium text-slate-700">Password</label>
                    <div className="relative">
                        <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm p-2.5 pr-10 focus:ring-blue-500 focus:border-blue-500 text-slate-800" placeholder="Enter your password" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700" aria-label="Toggle password visibility">
                            {showPassword ? 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-1.563 3.029m0 0l-2.122 2.122" /></svg> : 
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.522 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                        </button>
                    </div>
                </div>

                <div className="flex justify-end items-center mb-5">
                    <button type="button" onClick={() => { setForgotEmail(""); setForgotMsg(""); setShowForgot(true); }} className="text-xs font-medium text-blue-600 hover:underline">
                    Forgot Password?
                    </button>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed">
                    {loading ? "Logging in..." : "Login"}
                </button>
                {message && <p className="mt-4 text-sm text-center text-slate-700 font-medium">{message}</p>}
            </form>
        </div>

        {/* Modal Forgot Password (tidak ada perubahan) */}
        {showForgot&&(<div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4"><div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"><h3 className="text-xl font-semibold text-slate-800 mb-4">Forgot Password</h3><p className="text-sm text-slate-500 mb-4">Enter your email and we'll send you a link to reset your password.</p><input type="email"value={forgotEmail}onChange={(e)=>setForgotEmail(e.target.value)}className="w-full border-slate-300 rounded-lg p-2.5 mb-4 text-slate-800 focus:ring-blue-500 focus:border-blue-500"placeholder="Enter your email"/><div className="flex justify-end gap-3"><button type="button"onClick={()=>setShowForgot(false)}className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button><button type="button"onClick={handleForgotSubmit}className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"disabled={forgotLoading}>{forgotLoading?"Sending...":"Send Link"}</button></div>{forgotMsg&&<p className="mt-3 text-sm text-center text-slate-700">{forgotMsg}</p>}</div></div>)}
      </main>
    </div>
  );
}