import React, { useState } from "react";
import { useLocation } from "wouter";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ConciergeBell } from "lucide-react";
import { login } from "@/api/auth";

const logoPath = "/logo.png";

export default function ReceptionLogin() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await login({ email, password });
      if (response.user.role === "admin") {
        // Admins can also access reception panel
        setLocation("/reception/dashboard");
      } else if (response.user.role !== "receptionist") {
        setError("Access denied. Only receptionist accounts can log in here.");
        return;
      } else {
        setLocation("/reception/dashboard");
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-4 sm:p-6 text-[#20352b] antialiased">
      <div className="w-full max-w-md bg-[#fbf8f1] border border-[#20352b]/15 rounded-3xl p-8 sm:p-10 shadow-xl shadow-[#20352b]/5 relative overflow-hidden">
        {/* Top Accent — gold for reception */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#c8a36a] via-[#e8c48a] to-[#c8a36a]" />

        {/* Logo and Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-4">
            <img src={logoPath} alt="Casa Nest" className="h-24 mx-auto object-contain mix-blend-multiply" />
          </a>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8a36a]/15 border border-[#c8a36a]/30 text-[#c8a36a] text-[10px] font-mono uppercase tracking-widest font-semibold mb-3">
            <ConciergeBell size={12} />
            <span>Reception Panel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#20352b] mb-1">
            Welcome Back
          </h1>
          <p className="text-xs text-[#77766c]">
            Sign in to manage check-ins, bookings & orders
          </p>
        </div>

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
              Email
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
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#c8a36a] focus:bg-[#fbf8f1] transition-all"
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
                className="w-full bg-[#f5f0e8]/50 border border-[#20352b]/15 rounded-2xl pl-10 pr-10 py-3 text-sm text-[#20352b] placeholder:text-[#77766c]/60 focus:outline-none focus:border-[#c8a36a] focus:bg-[#fbf8f1] transition-all"
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
            className="w-full py-3.5 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 mt-2 shadow-sm disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #c8a36a, #b8923a)", color: "#20352b" }}
          >
            {loading ? "Signing in..." : "Sign In to Reception"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#20352b]/10 text-center flex flex-col gap-2">
          <a
            href="/admin/login"
            className="text-xs text-[#77766c] hover:text-[#20352b] transition-colors"
          >
            Admin? → Sign in to Admin Panel
          </a>
          <a
            href="/"
            className="text-xs text-[#77766c] hover:text-[#20352b] transition-colors"
          >
            ← Return to Casa Nest Website
          </a>
        </div>
      </div>
    </div>
  );
}
