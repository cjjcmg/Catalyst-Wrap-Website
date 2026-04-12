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

const LABELS = ["lead", "contact", "client", "past client"];

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [search, setSearch] = useState("");
  const [labelFilter, setLabelFilter] = useState("");

  // 3-day calendar state
  const [calStart, setCalStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [calAppts, setCalAppts] = useState<Record<string, DayAppointment[]>>({});
  const [calLoading, setCalLoading] = useState(true);

  const threeDays = [0, 1, 2].map((offset) => {
    const d = new Date(calStart);
    d.setDate(d.getDate() + offset);
    return d;
  });

  const fetchCalAppts = useCallback(async (start: Date) => {
    setCalLoading(true);
    const days = [0, 1, 2].map((offset) => {
      const d = new Date(start);
      d.setDate(d.getDate() + offset);
      return d;
    });

    const results = await Promise.all(
      days.map(async (d) => {
        const res = await fetch(`/api/admin/appointments?date=${toDateStr(d)}`);
        const data = await res.json();
        return { key: toDateStr(d), appts: (data.appointments || []) as DayAppointment[] };
      })
    );

    const map: Record<string, DayAppointment[]> = {};
    results.forEach((r) => { map[r.key] = r.appts; });
    setCalAppts(map);
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
  }, []);

  useEffect(() => {
    fetchCalAppts(calStart);
  }, [calStart, fetchCalAppts]);

  function prevPeriod() {
    setCalStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 3); return n; });
  }
  function nextPeriod() {
    setCalStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 3); return n; });
  }
  function goToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCalStart(d);
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

  // Filter contacts
  const filteredQuotes = quotes.filter((q) => {
    if (labelFilter === "__none" && q.label) return false;
    if (labelFilter && labelFilter !== "__none" && q.label !== labelFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.name.toLowerCase().includes(s) ||
      q.email.toLowerCase().includes(s) ||
      q.phone.includes(s) ||
      formatPhone(q.phone).includes(s) ||
      (q.service || "").toLowerCase().includes(s) ||
      (q.vehicle || "").toLowerCase().includes(s) ||
      (q.label || "").toLowerCase().includes(s)
    );
  });

  const isToday = toDateStr(calStart) === toDateStr(new Date());

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
            onClick={() => router.push("/admin/crm")}
            className="text-sm text-catalyst-red hover:text-white transition-colors whitespace-nowrap font-medium"
          >
            CRM
          </button>
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
              Contacts ({filteredQuotes.length}{filteredQuotes.length !== quotes.length ? ` / ${quotes.length}` : ""})
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

          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-catalyst-grey-600">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-catalyst-border bg-catalyst-black pl-9 pr-4 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
              />
            </div>
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none"
            >
              <option value="">All types</option>
              {LABELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
              <option value="__none">Unlabeled</option>
            </select>
          </div>

          {loading ? (
            <p className="text-catalyst-grey-500">Loading...</p>
          ) : filteredQuotes.length === 0 ? (
            <p className="text-catalyst-grey-500 text-sm">
              {quotes.length === 0 ? "No contacts yet." : "No contacts match your search."}
            </p>
          ) : (
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
              {filteredQuotes.map((q) => (
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

        {/* 3-Day Calendar Panel */}
        <div className="lg:w-[400px] flex-shrink-0 rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
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

          {/* Period nav */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={prevPeriod} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-center">
              <p className="text-white font-medium text-sm">
                {threeDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                {" — "}
                {threeDays[2].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
            <button onClick={nextPeriod} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {!isToday && (
            <button onClick={goToday} className="w-full text-center text-xs text-catalyst-grey-500 hover:text-white transition-colors">
              Go to Today
            </button>
          )}

          {/* 3-day columns */}
          {calLoading ? (
            <p className="text-catalyst-grey-500 text-sm">Loading...</p>
          ) : (
            <div className="space-y-4 max-h-[calc(100vh-340px)] overflow-y-auto">
              {threeDays.map((day) => {
                const key = toDateStr(day);
                const dayApptsList = (calAppts[key] || []).filter((a) => a.status === "scheduled");
                const isCurrentDay = key === toDateStr(new Date());

                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className={`text-xs font-semibold uppercase tracking-wider ${isCurrentDay ? "text-catalyst-red" : "text-catalyst-grey-500"}`}>
                        {formatDayLabel(day)}
                      </p>
                      <p className="text-xs text-catalyst-grey-600">
                        {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </p>
                    </div>

                    {dayApptsList.length === 0 ? (
                      <p className="text-catalyst-grey-600 text-xs py-2 pl-2">No appointments</p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayApptsList.map((appt) => (
                          <div
                            key={appt.id}
                            className="rounded-lg border border-catalyst-border/50 bg-catalyst-black p-2.5 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
                            onClick={() => router.push(`/admin/contact/${appt.quote_id}`)}
                          >
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
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
