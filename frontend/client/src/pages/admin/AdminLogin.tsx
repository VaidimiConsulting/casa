import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck, Home, LayoutDashboard } from "lucide-react";
import { login, getCurrentUser } from "@/api/auth";

const logoPath = "/logo.png";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login({ email, password });
      if (response.user.role !== "admin") {
        setError("Access denied. Only admin accounts can log in here.");
        return;
      }
      setLocation("/admin/dashboard");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col items-center justify-center p-4 sm:p-6 text-[#20352b] antialiased relative">
      {/* Top Header Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mb-4 px-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fbf8f1] border border-[#20352b]/15 text-xs font-semibold text-[#20352b] hover:bg-[#20352b] hover:text-[#fbf8f1] transition-all shadow-sm group"
        >
          <Home size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Website</span>
        </Link>

        {currentUser?.role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#20352b] text-[#fbf8f1] text-xs font-semibold hover:bg-[#2c473b] transition-all shadow-sm"
          >
            <LayoutDashboard size={14} />
            <span>Go to Dashboard</span>
          </Link>
        )}
      </div>

      <div className="w-full max-w-md bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#20352b]/5 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#20352b] via-[#c8a36a] to-[#20352b]" />

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4 group" title="Return to Casa Nest Homepage">
            <img src={logoPath} alt="Casa Nest" className="h-24 mx-auto object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f0e8] border border-[#20352b]/10 text-[#c8a36a] text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">
            <ShieldCheck size={12} />
            <span>Admin Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#20352b] mb-1">
            Sign in to Dashboard
          </h1>
          <p className="text-xs text-[#77766c]">
            Manage Casa Nest homestay, rooms, reservations & guest stays
          </p>
        </div>

        {/* Already logged in helper */}
        {currentUser?.role === "admin" && (
          <div className="mb-6 p-3.5 rounded-2xl bg-[#20352b]/10 border border-[#20352b]/20 flex items-center justify-between text-xs">
            <span className="font-medium text-[#20352b]">Already logged in as <strong>{currentUser.name}</strong></span>
            <Link href="/admin/dashboard" className="font-bold underline text-[#20352b] hover:text-[#c8a36a] ml-2">
              Dashboard →
            </Link>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#20352b] uppercase font-mono tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]"
              />
              <input
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] focus:bg-[#fbf8f1] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#20352b] uppercase font-mono tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77766c]"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-2xl pl-10 pr-10 py-3 text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#20352b] focus:bg-[#fbf8f1] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#77766c] hover:text-[#20352b]"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full button button-dark py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In to Portal"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-8 pt-6 border-t border-[#20352b]/10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#20352b] hover:text-[#c8a36a] transition-colors"
          >
            <Home size={13} />
            <span>← Return to Casa Nest Homestay website</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
