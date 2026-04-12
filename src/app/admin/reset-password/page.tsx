"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/reset-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to reset password");
    }
    setLoading(false);
  }

  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="font-heading text-2xl font-bold text-white">Invalid Link</h1>
        <p className="text-catalyst-grey-400 text-sm">This password reset link is invalid or has expired.</p>
        <button
          onClick={() => router.push("/admin/login")}
          className="text-sm text-catalyst-red hover:underline"
        >
          Back to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="font-heading text-2xl font-bold text-white">Password Reset</h1>
        <p className="text-catalyst-grey-300 text-sm">Your password has been updated. You can now log in.</p>
        <button
          onClick={() => router.push("/admin/login")}
          className="w-full rounded-lg bg-catalyst-red px-4 py-3 font-heading font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
      <h1 className="font-heading text-2xl font-bold text-white">Set New Password</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        required
        minLength={6}
        className="w-full rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-3 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
      />
      <input
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        required
        className="w-full rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-3 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-catalyst-red px-4 py-3 font-heading font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Suspense fallback={<p className="text-catalyst-grey-500">Loading...</p>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
