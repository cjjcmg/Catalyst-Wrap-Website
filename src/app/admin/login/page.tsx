"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      router.push(redirect);
    } else {
      const data = await res.json();
      setError(data.error || "Invalid email or password");
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setResetSent(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to send reset email");
    }
    setLoading(false);
  }

  if (resetMode) {
    return (
      <form onSubmit={handleReset} className="w-full max-w-sm space-y-4">
        <h1 className="font-heading text-2xl font-bold text-white">Reset Password</h1>
        {resetSent ? (
          <div className="space-y-4">
            <p className="text-catalyst-grey-300 text-sm">
              If an account exists with that email, a password reset link has been sent.
            </p>
            <button
              type="button"
              onClick={() => { setResetMode(false); setResetSent(false); }}
              className="text-sm text-catalyst-red hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <p className="text-catalyst-grey-400 text-sm">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-3 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-catalyst-red px-4 py-3 font-heading font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => { setResetMode(false); setError(""); }}
              className="text-sm text-catalyst-grey-400 hover:text-white transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Admin Login</h1>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        required
        className="w-full rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-3 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-3 pr-11 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-catalyst-grey-500 hover:text-white transition-colors"
        >
          {showPassword ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-catalyst-red px-4 py-3 font-heading font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Logging in..." : "Log In"}
      </button>
      <button
        type="button"
        onClick={() => { setResetMode(true); setError(""); }}
        className="text-sm text-catalyst-grey-400 hover:text-white transition-colors"
      >
        Forgot password?
      </button>
    </form>
  );
}

export default function AdminLogin() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-catalyst-grey-500">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
