"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Invoicing-scoped audit feed. Pulls crm_activities rows whose metadata.event
 * matches one of the invoicing lifecycle events. Shows who did what when,
 * linkable to the related quote / invoice / contact.
 */

interface Activity {
  id: number;
  activity_type: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  quote_id: number;
  agent_id: number | null;
  users?: { name: string } | null;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

const INVOICING_EVENTS = new Set([
  "viewed",
  "accepted",
  "declined",
  "expired",
  "acceptance_cancelled",
  "invoice_paid",
  "refund_issued",
]);

const EVENT_LABELS: Record<string, string> = {
  viewed: "Quote viewed",
  accepted: "Quote accepted",
  declined: "Quote declined",
  expired: "Quote expired",
  acceptance_cancelled: "Acceptance cancelled",
  invoice_paid: "Payment received",
  refund_issued: "Refund issued",
};

const EVENT_COLORS: Record<string, string> = {
  viewed: "bg-indigo-500/15 text-indigo-400",
  accepted: "bg-green-500/15 text-green-400",
  declined: "bg-red-500/15 text-red-400",
  expired: "bg-amber-500/15 text-amber-400",
  acceptance_cancelled: "bg-amber-500/15 text-amber-400",
  invoice_paid: "bg-emerald-500/15 text-emerald-400",
  refund_issued: "bg-orange-500/15 text-orange-400",
};

function fmtTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function AuditReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    // Fetch a broad recent window and filter client-side to invoicing events
    const r = await fetch(`/api/admin/crm/activities?limit=500`);
    const d = await r.json();
    const allActs: Activity[] = d.activities || [];
    const filtered = allActs.filter((a) => {
      const event = (a.metadata as { event?: string } | null)?.event;
      if (!event || !INVOICING_EVENTS.has(event)) {
        // fall back to subject-based matching for quote_sent (no event field)
        return a.activity_type === "quote_sent";
      }
      return true;
    });
    setActivities(filtered);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
  }, [router]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const visible = activities.filter((a) => {
    const event = (a.metadata as { event?: string } | null)?.event
      ?? (a.activity_type === "quote_sent" ? "sent" : "");
    if (eventFilter !== "all" && event !== eventFilter) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (a.subject || "").toLowerCase().includes(s) || (a.body || "").toLowerCase().includes(s);
    }
    return true;
  });

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Audit feed</h1>
        <p className="text-sm text-catalyst-grey-500 mt-1">Every invoicing lifecycle event — quote viewed, accepted, paid, refunded.</p>
      </div>

      <div className="flex items-center gap-1 border-b border-catalyst-border">
        <button onClick={() => router.push("/admin/reports/revenue")} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-catalyst-grey-400 hover:text-white transition-colors">Revenue</button>
        <button onClick={() => router.push("/admin/reports/audit")} className="px-4 py-2 text-sm font-medium border-b-2 border-catalyst-red text-white">Audit feed</button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "sent", "viewed", "accepted", "declined", "expired", "invoice_paid", "refund_issued"] as const).map((e) => (
          <button
            key={e}
            onClick={() => setEventFilter(e)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              eventFilter === e
                ? "bg-catalyst-red text-white"
                : "bg-catalyst-card text-catalyst-grey-400 border border-catalyst-border hover:text-white"
            }`}
          >
            {e === "all" ? "All" : e === "sent" ? "Quote sent" : EVENT_LABELS[e] || e}
          </button>
        ))}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject / body"
          className="ml-auto w-full sm:w-72 rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1.5 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
        />
      </div>

      <div className="rounded-xl border border-catalyst-border bg-catalyst-card overflow-hidden">
        {loading ? (
          <p className="p-6 text-catalyst-grey-500 text-sm">Loading...</p>
        ) : visible.length === 0 ? (
          <p className="p-6 text-catalyst-grey-500 text-sm italic">No activities match the current filters.</p>
        ) : (
          <ul className="divide-y divide-catalyst-border/50">
            {visible.map((a) => {
              const event = (a.metadata as { event?: string } | null)?.event
                ?? (a.activity_type === "quote_sent" ? "sent" : null);
              const label = event ? (event === "sent" ? "Quote sent" : EVENT_LABELS[event] || event) : a.activity_type;
              const color = event ? (EVENT_COLORS[event] || "bg-catalyst-grey-500/15 text-catalyst-grey-300") : "bg-catalyst-grey-500/15 text-catalyst-grey-300";
              const meta = a.metadata as { sales_quote_id?: number; quote_number?: string; invoice_id?: number; invoice_number?: string } | null;
              return (
                <li key={a.id} className="px-4 py-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>
                      {label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white">{a.subject}</div>
                      {a.body && <div className="text-xs text-catalyst-grey-500 mt-0.5">{a.body}</div>}
                      <div className="text-xs text-catalyst-grey-600 mt-1 flex items-center gap-3 flex-wrap">
                        <span>{fmtTimestamp(a.created_at)}</span>
                        {a.users?.name && <span>· by {a.users.name}</span>}
                        {meta?.sales_quote_id && (
                          <Link href={`/admin/quotes-docs/${meta.sales_quote_id}`} className="text-catalyst-red hover:underline">
                            {meta.quote_number || `Quote #${meta.sales_quote_id}`}
                          </Link>
                        )}
                        {meta?.invoice_id && (
                          <Link href={`/admin/invoices/${meta.invoice_id}`} className="text-catalyst-red hover:underline">
                            {meta.invoice_number || `Invoice #${meta.invoice_id}`}
                          </Link>
                        )}
                        <Link href={`/admin/crm/contacts/${a.quote_id}`} className="text-catalyst-grey-400 hover:text-white">
                          Contact
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
