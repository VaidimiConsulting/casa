import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { register } from "@/api/auth";

const logoPath = "/logo.png";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const PHONE_REGEX = /^\+?[0-9\s-]{10,15}$/;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || form.name.trim().length < 2) {
      setError("Please enter a valid full name (at least 2 characters).");
      return;
    }

    if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (form.phone.trim() && !PHONE_REGEX.test(form.phone.trim())) {
      setError("Please enter a valid 10-15 digit phone number.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      window.location.href = "/my-bookings";
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <a href="/" className="auth-brand">
          <img src={logoPath} alt="Casa Nest" className="mix-blend-multiply" />
        </a>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join Casa Nest and plan your perfect stay</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            <span>Full name</span>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>
          </label>

          <label className="auth-label">
            <span>Email address</span>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label className="auth-label">
            <span>Phone (optional)</span>
            <div className="auth-input-wrap">
              <Phone size={16} className="auth-input-icon" />
              <input
                type="tel"
                name="phone"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>
          </label>

          <label className="auth-label">
            <span>Password</span>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="button button-dark auth-submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Create account"}
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <a href="/login">Sign in</a>
        </p>

        <a href="/" className="auth-back">← Back to home</a>
      </div>
    </div>
  );
}
