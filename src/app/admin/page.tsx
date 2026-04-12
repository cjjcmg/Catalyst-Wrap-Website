"use client";

import { useEffect, useState, useCallback } from "react";
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
  label: string | null;
}

interface DayAppointment {
  id: number;
  quote_id: number;
  title: string | null;
  date_time: string;
  end_time: string | null;
  details: string | null;
  status: string;
  quotes?: { name: string; email: string; service: string } | null;
}

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
}

const LABEL_COLORS: Record<string, string> = {
  lead: "bg-blue-500/15 text-blue-400",
  contact: "bg-purple-500/15 text-purple-400",
  client: "bg-green-500/15 text-green-400",
  "past client": "bg-catalyst-grey-500/15 text-catalyst-grey-400",
};

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function formatDayDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  if (target.getTime() === today.getTime()) return "Today";
  if (target.getTime() === tomorrow.getTime()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar state
  const [calDate, setCalDate] = useState(new Date());
  const [dayAppts, setDayAppts] = useState<DayAppointment[]>([]);
  const [calLoading, setCalLoading] = useState(true);

  const fetchDayAppts = useCallback(async (date: Date) => {
    setCalLoading(true);
    const res = await fetch(`/api/admin/appointments?date=${toDateStr(date)}`);
    const data = await res.json();
    setDayAppts(data.appointments || []);
    setCalLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));

    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d.quotes || []);
        setLoading(false);
      });

    fetchDayAppts(new Date());
  }, [fetchDayAppts]);

  useEffect(() => {
    fetchDayAppts(calDate);
  }, [calDate, fetchDayAppts]);

  function prevDay() {
    setCalDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  }
  function nextDay() {
    setCalDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  }
  function goToday() {
    setCalDate(new Date());
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

  const scheduledAppts = dayAppts.filter((a) => a.status === "scheduled");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
          <button
            onClick={() => router.push("/admin/settings")}
            className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap"
          >
            Settings
          </button>
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

      {/* Main content: Contacts + Calendar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Contacts list */}
        <div className="flex-1 min-w-0 rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
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
            <div className="space-y-2">
              {quotes.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-catalyst-border bg-catalyst-black p-3 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
                  onClick={() => router.push(`/admin/contact/${q.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium truncate">{q.name}</p>
                      {q.label && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${LABEL_COLORS[q.label] || "bg-catalyst-grey-500/15 text-catalyst-grey-400"}`}>
                          {q.label}
                        </span>
                      )}
                      <p className="text-xs text-catalyst-grey-500 whitespace-nowrap">{new Date(q.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-catalyst-grey-400 mt-0.5">
                      <span className="truncate">{q.email}</span>
                      <span className="whitespace-nowrap">{formatPhone(q.phone)}</span>
                    </div>
                    {q.service && (
                      <p className="text-xs text-catalyst-grey-500 mt-0.5">{q.service}{q.vehicle ? ` — ${q.vehicle}` : ""}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); archiveQuote(q.id); }}
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
              ))}
            </div>
          )}
        </div>

        {/* Day Calendar Panel */}
        <div className="lg:w-[380px] flex-shrink-0 rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-white">Schedule</h2>
            <button
              onClick={() => router.push("/admin/schedule")}
              className="text-xs text-catalyst-grey-500 hover:text-white transition-colors"
            >
              + Add Appt
            </button>
          </div>

          {/* Date nav */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={prevDay} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-white font-medium text-sm">{formatDayDate(calDate)}</p>
              <p className="text-catalyst-grey-500 text-xs">
                {calDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <button onClick={nextDay} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Today button */}
          {toDateStr(calDate) !== toDateStr(new Date()) && (
            <button onClick={goToday} className="w-full text-center text-xs text-catalyst-grey-500 hover:text-white transition-colors">
              Go to Today
            </button>
          )}

          {/* Events list */}
          {calLoading ? (
            <p className="text-catalyst-grey-500 text-sm">Loading...</p>
          ) : scheduledAppts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-catalyst-grey-500 text-sm">No appointments</p>
              <p className="text-catalyst-grey-600 text-xs mt-1">Click + Add Appt to schedule one</p>
            </div>
          ) : (
            <div className="space-y-2">
              {scheduledAppts.map((appt) => (
                <div
                  key={appt.id}
                  className="rounded-lg border border-catalyst-border/50 bg-catalyst-black p-3 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
                  onClick={() => router.push(`/admin/contact/${appt.quote_id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {appt.title && (
                        <p className="text-white text-sm font-medium truncate">{appt.title}</p>
                      )}
                      <p className="text-catalyst-grey-300 text-xs">
                        {new Date(appt.date_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        {appt.end_time && (
                          <> — {new Date(appt.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>
                        )}
                      </p>
                      {appt.quotes?.name && (
                        <p className="text-catalyst-grey-400 text-xs mt-0.5">{appt.quotes.name}</p>
                      )}
                      {appt.details && (
                        <p className="text-catalyst-grey-500 text-xs mt-0.5 truncate">{appt.details}</p>
                      )}
                    </div>
                    {appt.quotes?.service && (
                      <span className="text-catalyst-grey-600 text-xs whitespace-nowrap">{appt.quotes.service}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
