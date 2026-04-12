"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Reminder {
  id: number;
  quote_id: number;
  reminder_date: string;
  reminder_type: string;
  message: string | null;
  is_completed: boolean;
  quotes?: { name: string; contact_tag: string | null; email: string; phone: string } | null;
  users?: { name: string } | null;
}

const TAG_DOT: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-amber-500",
  C: "bg-red-500",
};

const TABS = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "completed", label: "Completed" },
] as const;

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CRMRemindersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<string>("overdue");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/crm/reminders?filter=${tab}`)
      .then((r) => r.json())
      .then((d) => {
        setReminders(d.reminders || []);
        setLoading(false);
      });
  }, [tab]);

  async function completeReminder(id: number) {
    const res = await fetch("/api/admin/crm/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/crm")} className="text-catalyst-grey-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Reminders</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-catalyst-border bg-catalyst-black p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-catalyst-card text-white"
                : "text-catalyst-grey-500 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Reminders list */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-2">
        {loading ? (
          <p className="text-catalyst-grey-500 text-sm">Loading...</p>
        ) : reminders.length === 0 ? (
          <p className="text-catalyst-grey-500 text-sm py-4 text-center">
            {tab === "overdue" ? "No overdue reminders — you're all caught up!" : `No ${tab} reminders.`}
          </p>
        ) : (
          reminders.map((r) => {
            const isOverdue = !r.is_completed && new Date(r.reminder_date) < new Date();

            return (
              <div
                key={r.id}
                className={`flex items-start gap-3 rounded-lg border p-4 ${
                  isOverdue ? "border-red-500/20 bg-red-500/5" : r.is_completed ? "border-catalyst-border/30 bg-catalyst-black/50" : "border-catalyst-border/50 bg-catalyst-black"
                }`}
              >
                {/* Tag dot */}
                <div className="mt-1 flex-shrink-0">
                  {r.quotes?.contact_tag ? (
                    <div className={`w-3 h-3 rounded-full ${TAG_DOT[r.quotes.contact_tag] || "bg-catalyst-grey-500"}`} />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-catalyst-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => router.push(`/admin/crm/contacts/${r.quote_id}`)}
                      className="text-sm text-white font-medium hover:text-catalyst-red transition-colors"
                    >
                      {r.quotes?.name || `Contact #${r.quote_id}`}
                    </button>
                    <span className={`text-xs ${isOverdue ? "text-red-400" : r.is_completed ? "text-catalyst-grey-500" : "text-catalyst-grey-300"}`}>
                      {formatDate(r.reminder_date)}
                    </span>
                  </div>
                  {r.message && (
                    <p className={`text-sm mt-0.5 ${r.is_completed ? "text-catalyst-grey-600" : "text-catalyst-grey-300"}`}>
                      {r.message}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-catalyst-grey-500">
                    {r.users?.name && <span>Assigned to {r.users.name}</span>}
                    <span className="capitalize">{r.reminder_type?.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {/* Complete button */}
                {!r.is_completed && (
                  <button
                    onClick={() => completeReminder(r.id)}
                    className="flex-shrink-0 rounded-lg border border-catalyst-border px-3 py-1 text-xs text-catalyst-grey-400 hover:text-green-400 hover:border-green-500/30 transition-colors"
                  >
                    Mark Done
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
