"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Stats {
  totalContacts: number;
  leadsToday: number;
  pipeline: Record<string, number>;
  tags: Record<string, number>;
  recentActivities: Array<{
    id: number;
    activity_type: string;
    subject: string | null;
    created_at: string;
    quotes?: { name: string } | null;
  }>;
  overdueReminders: Array<{
    id: number;
    message: string | null;
    reminder_date: string;
    quote_id: number;
    quotes?: { name: string; contact_tag: string | null } | null;
  }>;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
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

const PIPELINE_LABELS: Record<string, string> = {
  new: "New", contacted: "Contacted", quoted: "Quoted", accepted: "Accepted",
  scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed",
  past_client: "Past Client", lost: "Lost",
};

const PIPELINE_COLORS: Record<string, string> = {
  new: "bg-blue-500", contacted: "bg-cyan-500", quoted: "bg-purple-500",
  accepted: "bg-emerald-500", scheduled: "bg-amber-500", in_progress: "bg-orange-500",
  completed: "bg-green-500", past_client: "bg-catalyst-grey-500", lost: "bg-red-500",
};

const TAG_COLORS: Record<string, string> = {
  A: "bg-green-500 text-white", B: "bg-amber-500 text-black", C: "bg-red-500 text-white", "!": "bg-violet-500 text-white",
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: "📞", email: "📧", text: "💬", meeting: "🤝", note: "📝", quote_sent: "📋", follow_up: "🔄",
};

function toDateStr(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDayLabel(date: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(date); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function CRMDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  // 3-day calendar
  const [calStart, setCalStart] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [calAppts, setCalAppts] = useState<Record<string, DayAppointment[]>>({});
  const [calLoading, setCalLoading] = useState(true);
  const [deletingApptId, setDeletingApptId] = useState<number | null>(null);

  const threeDays = [0, 1, 2].map((offset) => { const d = new Date(calStart); d.setDate(d.getDate() + offset); return d; });

  const fetchCalAppts = useCallback(async (start: Date) => {
    setCalLoading(true);
    const days = [0, 1, 2].map((i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
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
    Promise.all([
      fetch("/api/admin/me").then((r) => r.json()),
      fetch("/api/admin/crm/stats").then((r) => r.json()),
      fetch("/api/admin/crm/notifications").then((r) => r.json()),
    ]).then(([u, s, n]) => {
      setUser(u.user || null);
      setStats(s);
      setNotifications(n.notifications || []);
      setUnreadCount(n.unread_count || 0);
      setLoading(false);
    });
    fetchCalAppts(new Date());
  }, [fetchCalAppts]);

  useEffect(() => { fetchCalAppts(calStart); }, [calStart, fetchCalAppts]);

  function prevPeriod() { setCalStart((d) => { const n = new Date(d); n.setDate(n.getDate() - 3); return n; }); }
  function nextPeriod() { setCalStart((d) => { const n = new Date(d); n.setDate(n.getDate() + 3); return n; }); }
  function goToday() { const d = new Date(); d.setHours(0, 0, 0, 0); setCalStart(d); }

  async function markAllRead() {
    await fetch("/api/admin/crm/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mark_all_read: true }) });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function completeReminder(id: number) {
    const res = await fetch("/api/admin/crm/reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok && stats) {
      setStats({ ...stats, overdueReminders: stats.overdueReminders.filter((r) => r.id !== id) });
    }
  }

  async function deleteAppt(id: number) {
    const res = await fetch("/api/admin/appointments", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (res.ok) {
      setCalAppts((prev) => {
        const next: Record<string, DayAppointment[]> = {};
        Object.entries(prev).forEach(([k, v]) => { next[k] = v.filter((a) => a.id !== id); });
        return next;
      });
    }
    setDeletingApptId(null);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"><p className="text-catalyst-grey-500">Loading...</p></div>;

  const pipelineTotal = stats ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0) : 0;
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
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification bell */}
          <div className="relative">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative text-catalyst-grey-500 hover:text-white transition-colors p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-catalyst-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-catalyst-border bg-catalyst-card shadow-2xl z-50">
                <div className="flex items-center justify-between p-3 border-b border-catalyst-border">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-catalyst-red hover:underline">Mark all read</button>}
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-catalyst-grey-500">No notifications</p>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div key={n.id} className={`p-3 border-b border-catalyst-border/50 cursor-pointer hover:bg-white/5 ${!n.is_read ? "bg-catalyst-red/5" : ""}`} onClick={() => n.link && router.push(n.link)}>
                      <p className={`text-sm ${!n.is_read ? "text-white font-medium" : "text-catalyst-grey-300"}`}>{n.title}</p>
                      {n.message && <p className="text-xs text-catalyst-grey-500 mt-0.5">{n.message}</p>}
                      <p className="text-xs text-catalyst-grey-600 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={() => router.push("/admin/crm/contacts")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap">Contacts</button>
          <button onClick={() => router.push("/admin/crm/reminders")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap">Reminders</button>
          <button onClick={() => router.push("/admin/settings")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap">Settings</button>
          {user?.role === "admin" && (
            <button onClick={() => router.push("/admin/audit-log")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap">Audit Log</button>
          )}
          <button onClick={handleLogout} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors whitespace-nowrap">Log Out</button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div
              className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
              onClick={() => router.push("/admin/crm/contacts")}
            >
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Total Contacts</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalContacts}</p>
            </div>
            <div
              className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
              onClick={() => router.push("/admin/crm/contacts?status=new")}
            >
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Leads Today</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.leadsToday}</p>
            </div>
            <div
              className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
              onClick={() => router.push("/admin/crm/reminders")}
            >
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Overdue Reminders</p>
              <p className="text-2xl font-bold text-catalyst-red mt-1">{stats.overdueReminders.length}</p>
            </div>
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Tags</p>
              <div className="flex items-center gap-2 mt-1">
                {(["A", "B", "C", "!"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => router.push(`/admin/crm/contacts?tag=${t}`)}
                    className={`rounded-full px-2 py-0.5 text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${TAG_COLORS[t]}`}
                  >
                    {t}: {stats.tags[t]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline bar */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-3">
            <h2 className="font-heading text-lg font-semibold text-white">Pipeline</h2>
            {pipelineTotal > 0 ? (
              <>
                <div className="flex rounded-full overflow-hidden h-6">
                  {Object.entries(stats.pipeline).filter(([, count]) => count > 0).map(([status, count]) => (
                    <div key={status} onClick={() => router.push(`/admin/crm/contacts?status=${status}`)} className={`${PIPELINE_COLORS[status] || "bg-catalyst-grey-500"} flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:opacity-80 transition-opacity`} style={{ width: `${(count / pipelineTotal) * 100}%` }} title={`${PIPELINE_LABELS[status]}: ${count}`}>
                      {count > 0 && (count / pipelineTotal) > 0.06 ? count : ""}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.pipeline).filter(([, count]) => count > 0).map(([status, count]) => (
                    <div key={status} className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${PIPELINE_COLORS[status]}`} />
                      <span className="text-xs text-catalyst-grey-400">{PIPELINE_LABELS[status]} ({count})</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-catalyst-grey-500 text-sm">No contacts in pipeline yet.</p>
            )}
          </div>

          {/* Three columns: Overdue Reminders + Recent Activity + Calendar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Overdue Reminders */}
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-white">Overdue</h2>
                <button onClick={() => router.push("/admin/crm/reminders")} className="text-xs text-catalyst-grey-500 hover:text-white transition-colors">View all</button>
              </div>
              {stats.overdueReminders.length === 0 ? (
                <p className="text-catalyst-grey-500 text-sm py-4">All caught up!</p>
              ) : (
                <div className="space-y-2">
                  {stats.overdueReminders.map((r) => (
                    <div key={r.id} className="flex items-start justify-between gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {r.quotes?.contact_tag && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.quotes.contact_tag === "A" ? "bg-green-500" : r.quotes.contact_tag === "B" ? "bg-amber-500" : r.quotes.contact_tag === "!" ? "bg-violet-500" : "bg-red-500"}`} />}
                          <button onClick={() => router.push(`/admin/crm/contacts/${r.quote_id}`)} className="text-sm text-white font-medium hover:text-catalyst-red truncate">{r.quotes?.name || `#${r.quote_id}`}</button>
                        </div>
                        {r.message && <p className="text-xs text-catalyst-grey-400 mt-0.5">{r.message}</p>}
                        <p className="text-xs text-red-400 mt-0.5">{formatDate(r.reminder_date)}</p>
                      </div>
                      <button onClick={() => completeReminder(r.id)} className="text-xs text-catalyst-grey-500 hover:text-green-400 transition-colors flex-shrink-0">Done</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-3">
              <h2 className="font-heading text-lg font-semibold text-white">Recent Activity</h2>
              {stats.recentActivities.length === 0 ? (
                <p className="text-catalyst-grey-500 text-sm py-4">No activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivities.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex items-start gap-3 py-2 border-b border-catalyst-border/30 last:border-0">
                      <span className="text-lg flex-shrink-0">{ACTIVITY_ICONS[a.activity_type] || "📌"}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-white">
                          <span className="text-catalyst-grey-300">{a.activity_type}</span>
                          {a.quotes?.name && <> — <span className="font-medium">{a.quotes.name}</span></>}
                        </p>
                        {a.subject && <p className="text-xs text-catalyst-grey-400 truncate">{a.subject}</p>}
                        <p className="text-xs text-catalyst-grey-600 mt-0.5">{formatDate(a.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {stats.recentActivities.length > 4 && (
                    <button onClick={() => router.push("/admin/audit-log")} className="text-xs text-catalyst-grey-500 hover:text-white transition-colors pt-1">more . . .</button>
                  )}
                </div>
              )}
            </div>

            {/* 3-Day Calendar */}
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-white">Schedule</h2>
                <button onClick={() => router.push("/admin/schedule")} className="text-xs text-catalyst-grey-500 hover:text-white transition-colors">+ Add Appt</button>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button onClick={prevPeriod} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <p className="text-white font-medium text-sm text-center">
                  {threeDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} — {threeDays[2].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
                <button onClick={nextPeriod} className="text-catalyst-grey-500 hover:text-white transition-colors p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>

              {!isToday && <button onClick={goToday} className="w-full text-center text-xs text-catalyst-grey-500 hover:text-white transition-colors">Go to Today</button>}

              {calLoading ? (
                <p className="text-catalyst-grey-500 text-sm">Loading...</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {threeDays.map((day) => {
                    const key = toDateStr(day);
                    const dayAppts = (calAppts[key] || []).filter((a) => a.status === "scheduled");
                    const isCurrentDay = key === toDateStr(new Date());
                    return (
                      <div key={key}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className={`text-xs font-semibold uppercase tracking-wider ${isCurrentDay ? "text-catalyst-red" : "text-catalyst-grey-500"}`}>{formatDayLabel(day)}</p>
                          <p className="text-xs text-catalyst-grey-600">{day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
                        </div>
                        {dayAppts.length === 0 ? (
                          <p className="text-catalyst-grey-600 text-xs py-1 pl-2">No appointments</p>
                        ) : (
                          <div className="space-y-1.5">
                            {dayAppts.map((appt) => (
                              <div key={appt.id} className="group relative rounded-lg border border-catalyst-border/50 bg-catalyst-black p-2.5 cursor-pointer hover:border-catalyst-grey-600 transition-colors" onClick={() => router.push(`/admin/crm/contacts/${appt.quote_id}`)}>
                                <div className="flex items-start justify-between gap-1">
                                  <div className="min-w-0 flex-1">
                                    {appt.title && <p className="text-white text-sm font-medium truncate">{appt.title}</p>}
                                    <p className="text-catalyst-grey-300 text-xs">
                                      {new Date(appt.date_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                      {appt.end_time && <> — {new Date(appt.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>}
                                    </p>
                                    {appt.quotes?.name && <p className="text-catalyst-grey-400 text-xs mt-0.5">{appt.quotes.name}</p>}
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => router.push(`/admin/schedule?edit=${appt.id}`)} className="p-1 text-catalyst-grey-600 hover:text-white transition-colors" title="Edit">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                    </button>
                                    <button onClick={() => setDeletingApptId(appt.id)} className="p-1 text-catalyst-grey-600 hover:text-red-400 transition-colors" title="Cancel">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                    </button>
                                  </div>
                                </div>
                                {/* Delete confirmation */}
                                {deletingApptId === appt.id && (
                                  <div className="mt-2 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 p-2" onClick={(e) => e.stopPropagation()}>
                                    <p className="text-xs text-red-400 flex-1">Cancel this appointment?</p>
                                    <button onClick={() => deleteAppt(appt.id)} className="rounded bg-red-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors">Yes</button>
                                    <button onClick={() => setDeletingApptId(null)} className="rounded border border-catalyst-border px-2 py-0.5 text-xs text-catalyst-grey-400 hover:text-white transition-colors">No</button>
                                  </div>
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
        </>
      )}
    </div>
  );
}
