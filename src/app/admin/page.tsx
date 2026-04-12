"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Quote {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  message: string;
  text_updates: boolean;
  archived: boolean;
}

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

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

    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d.quotes || []);
        setLoading(false);
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

  async function archiveQuote(id: number) {
    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: true }),
    });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 sm:space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          {user && (
            <p className="text-sm text-catalyst-grey-400 mt-0.5">
              Logged in as <span className="text-white">{user.name}</span>
              <span className="text-catalyst-grey-600"> ({user.role})</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user?.role === "admin" && (
            <button
              onClick={() => router.push("/admin/audit-log")}
              className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap"
            >
              Audit Log
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
        <h2 className="font-heading text-lg sm:text-xl font-semibold text-white">Settings</h2>
        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-2">Notification Email</label>
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

      {/* Quotes */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg sm:text-xl font-semibold text-white">
            Contacts ({quotes.length})
          </h2>
          <button
            onClick={() => router.push("/admin/archived")}
            className="flex items-center gap-1.5 text-sm text-catalyst-grey-500 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            Archived
          </button>
        </div>

        {loading ? (
          <p className="text-catalyst-grey-500">Loading...</p>
        ) : quotes.length === 0 ? (
          <p className="text-catalyst-grey-500">No contacts yet.</p>
        ) : (
          <>
          {/* Mobile card layout */}
          <div className="space-y-3 lg:hidden">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-catalyst-border bg-catalyst-black p-4 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
                onClick={() => router.push(`/admin/contact/${q.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{q.name}</p>
                    <p className="text-xs text-catalyst-grey-500">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/admin/contact/${q.id}`);
                      }}
                      className="tooltip text-catalyst-grey-600 hover:text-catalyst-red transition-colors"
                      data-tip="Notes"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveQuote(q.id);
                      }}
                      className="tooltip text-catalyst-grey-600 hover:text-amber-500 transition-colors"
                      data-tip="Archive"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="21 8 21 21 3 21 3 8" />
                        <rect x="1" y="3" width="22" height="5" />
                        <line x1="10" y1="12" x2="14" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-catalyst-grey-300 truncate">{q.email}</p>
                  <p className="text-catalyst-grey-300">{formatPhone(q.phone)}</p>
                  {q.service && <p className="text-catalyst-grey-400">Service: {q.service}</p>}
                  {q.vehicle && <p className="text-catalyst-grey-400">Vehicle: {q.vehicle}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden lg:block">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-catalyst-border text-left text-catalyst-grey-400">
                  <th className="pb-3 pr-4 font-medium w-[90px]">Date</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium w-[120px]">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-catalyst-border/50 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => router.push(`/admin/contact/${q.id}`)}
                  >
                    <td className="py-3 pr-4 text-catalyst-grey-400 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-white truncate">{q.name}</td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.email}>
                      {q.email}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 whitespace-nowrap">
                      {formatPhone(q.phone)}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.service}>
                      {q.service}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.vehicle}>
                      {q.vehicle}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/contact/${q.id}`);
                          }}
                          className="tooltip text-catalyst-grey-600 hover:text-catalyst-red transition-colors"
                          data-tip="Notes"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveQuote(q.id);
                          }}
                          className="tooltip text-catalyst-grey-600 hover:text-amber-500 transition-colors"
                          data-tip="Archive"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="21 8 21 21 3 21 3 8" />
                            <rect x="1" y="3" width="22" height="5" />
                            <line x1="10" y1="12" x2="14" y2="12" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
