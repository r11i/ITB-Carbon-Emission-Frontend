import { useState, useEffect } from "react";
import Head from "next/head"; // <-- PENAMBAHAN
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

export default function AdminUserRegisterPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const { isSuperAdmin, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && !isSuperAdmin) {
      router.replace("/login?message=Super Admin access required.");
    }
  }, [isSuperAdmin, isAuthLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error("Authentication token not found.");

      const res = await fetch(`/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ username: form.username, password: form.password, role: 'user' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not register user.");
      }
      
      setMessage(`✅ User ${form.username} registered! Check their email to confirm the sign up!`);
      
      setForm({ username: "", password: "" });
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center p-10">
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>User Management | ITB Carbon Emissions Visualization</title>
        <meta name="description" content="Admin page for user registration." />
        <link rel="icon" href="/logo-itb.svg" />
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-grow flex flex-col items-center pt-10 p-6">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">User Management</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">New User's Email</label>
                <input type="email" name="username" value={form.username} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" placeholder="newuser@example.com" required />
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">Set Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border-slate-300 rounded-lg shadow-sm p-2.5 focus:ring-blue-500 focus:border-blue-500" placeholder="Minimum 6 characters" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed">
                {loading ? "Creating User..." : "Create User"}
              </button>
              
              {message && (
                <div className={`mt-4 p-3 rounded-lg text-sm text-center font-medium ${message.startsWith('✅') 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </main>
      </div>
    </>
  );
}