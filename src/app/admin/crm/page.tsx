"use client";

import { useEffect, useState } from "react";
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

const PIPELINE_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  client: "Client",
  past_client: "Past Client",
  lost: "Lost",
};

const PIPELINE_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  contacted: "bg-cyan-500",
  quoted: "bg-purple-500",
  scheduled: "bg-amber-500",
  in_progress: "bg-orange-500",
  completed: "bg-green-500",
  client: "bg-emerald-500",
  past_client: "bg-catalyst-grey-500",
  lost: "bg-red-500",
};

const TAG_COLORS: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-amber-500 text-black",
  C: "bg-red-500 text-white",
};

const ACTIVITY_ICONS: Record<string, string> = {
  call: "📞",
  email: "📧",
  text: "💬",
  meeting: "🤝",
  note: "📝",
  quote_sent: "📋",
  follow_up: "🔄",
};

export default function CRMDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/crm/stats").then((r) => r.json()),
      fetch("/api/admin/crm/notifications").then((r) => r.json()),
    ]).then(([s, n]) => {
      setStats(s);
      setNotifications(n.notifications || []);
      setUnreadCount(n.unread_count || 0);
      setLoading(false);
    });
  }, []);

  async function markAllRead() {
    await fetch("/api/admin/crm/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }

  async function completeReminder(id: number) {
    const res = await fetch("/api/admin/crm/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok && stats) {
      setStats({
        ...stats,
        overdueReminders: stats.overdueReminders.filter((r) => r.id !== id),
      });
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-catalyst-grey-500">Loading CRM...</p>
      </div>
    );
  }

  const pipelineTotal = stats ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin")} className="text-catalyst-grey-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">CRM</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notification bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative text-catalyst-grey-500 hover:text-white transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-catalyst-red text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{unreadCount}</span>
              )}
            </button>
            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-catalyst-border bg-catalyst-card shadow-2xl z-50">
                <div className="flex items-center justify-between p-3 border-b border-catalyst-border">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-catalyst-red hover:underline">Mark all read</button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-catalyst-grey-500">No notifications</p>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border-b border-catalyst-border/50 cursor-pointer hover:bg-white/5 ${!n.is_read ? "bg-catalyst-red/5" : ""}`}
                      onClick={() => n.link && router.push(n.link)}
                    >
                      <p className={`text-sm ${!n.is_read ? "text-white font-medium" : "text-catalyst-grey-300"}`}>{n.title}</p>
                      {n.message && <p className="text-xs text-catalyst-grey-500 mt-0.5">{n.message}</p>}
                      <p className="text-xs text-catalyst-grey-600 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button onClick={() => router.push("/admin/crm/contacts")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors">Contacts</button>
          <button onClick={() => router.push("/admin/crm/reminders")} className="text-sm text-catalyst-grey-500 hover:text-white transition-colors">Reminders</button>
        </div>
      </div>

      {stats && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Total Contacts</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalContacts}</p>
            </div>
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Leads Today</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.leadsToday}</p>
            </div>
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Overdue Reminders</p>
              <p className="text-2xl font-bold text-catalyst-red mt-1">{stats.overdueReminders.length}</p>
            </div>
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Tags</p>
              <div className="flex items-center gap-2 mt-1">
                {(["A", "B", "C"] as const).map((t) => (
                  <span key={t} className={`rounded-full px-2 py-0.5 text-xs font-bold ${TAG_COLORS[t]}`}>
                    {t}: {stats.tags[t]}
                  </span>
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
                    <div
                      key={status}
                      className={`${PIPELINE_COLORS[status] || "bg-catalyst-grey-500"} flex items-center justify-center text-xs font-bold text-white`}
                      style={{ width: `${(count / pipelineTotal) * 100}%` }}
                      title={`${PIPELINE_LABELS[status]}: ${count}`}
                    >
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

          {/* Two column: Overdue Reminders + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overdue Reminders */}
            <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-white">Overdue Reminders</h2>
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
                          {r.quotes?.contact_tag && (
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.quotes.contact_tag === "A" ? "bg-green-500" : r.quotes.contact_tag === "B" ? "bg-amber-500" : "bg-red-500"}`} />
                          )}
                          <button onClick={() => router.push(`/admin/crm/contacts/${r.quote_id}`)} className="text-sm text-white font-medium hover:text-catalyst-red truncate">{r.quotes?.name || `#${r.quote_id}`}</button>
                        </div>
                        {r.message && <p className="text-xs text-catalyst-grey-400 mt-0.5">{r.message}</p>}
                        <p className="text-xs text-red-400 mt-0.5">{formatDate(r.reminder_date)}</p>
                      </div>
                      <button
                        onClick={() => completeReminder(r.id)}
                        className="text-xs text-catalyst-grey-500 hover:text-green-400 transition-colors flex-shrink-0"
                      >
                        Done
                      </button>
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
                  {stats.recentActivities.map((a) => (
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
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
