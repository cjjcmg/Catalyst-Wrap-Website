"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email);
        setSavedEmail(d.email);
      });
  }, []);

  async function saveEmail() {
    setEmailStatus("Saving...");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSavedEmail(email);
      setEmailStatus("Saved");
    } else {
      setEmailStatus("Error saving");
    }
    setTimeout(() => setEmailStatus(""), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin")}
          className="text-catalyst-grey-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Notification Email */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Notifications</h2>
        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-1">Notification Email</label>
          <p className="text-xs text-catalyst-grey-500 mb-2">New quote submissions will be sent to this email address.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
            />
            <button
              onClick={saveEmail}
              disabled={email === savedEmail}
              className="rounded-lg bg-catalyst-red px-5 py-2 font-heading text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-30"
            >
              Save
            </button>
          </div>
          {emailStatus && (
            <p className="mt-2 text-sm text-catalyst-grey-400">{emailStatus}</p>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Account</h2>
        {user && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-white capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            router.push("/admin/login?redirect=/admin/settings");
            fetch("/api/admin/logout", { method: "POST" });
          }}
          className="text-sm text-catalyst-grey-400 hover:text-white transition-colors"
        >
          Change Password
        </button>
      </div>

      {/* Team */}
      {user?.role === "admin" && (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-white">Team</h2>
          <p className="text-sm text-catalyst-grey-400">
            Manage team members by contacting your administrator or updating the users table directly.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-catalyst-border/50">
              <div>
                <p className="text-white">Chris</p>
                <p className="text-catalyst-grey-500">chris@catalystmotorsport.com</p>
              </div>
              <span className="text-xs text-catalyst-red font-medium">Admin</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-catalyst-border/50">
              <div>
                <p className="text-white">Jarod</p>
                <p className="text-catalyst-grey-500">jarod@catalystmotorsport.com</p>
              </div>
              <span className="text-xs text-catalyst-grey-500">User</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-white">Oveis</p>
                <p className="text-catalyst-grey-500">oveis@catalystmotorsport.com</p>
              </div>
              <span className="text-xs text-catalyst-grey-500">User</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
