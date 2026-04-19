"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Status = "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "converted";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  converted: "Converted",
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "bg-catalyst-grey-500/15 text-catalyst-grey-300",
  sent: "bg-blue-500/15 text-blue-400",
  viewed: "bg-indigo-500/15 text-indigo-400",
  accepted: "bg-green-500/15 text-green-400",
  declined: "bg-red-500/15 text-red-400",
  expired: "bg-amber-500/15 text-amber-400",
  converted: "bg-purple-500/15 text-purple-400",
};

interface QuoteRow {
  id: number;
  quote_number: string;
  status: Status;
  total: number;
  subtotal: number;
  created_at: string;
  expires_at: string | null;
  sent_at: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_size_tier: string;
  assigned_agent_id: number | null;
  quotes: { id: number; name: string; email: string; phone: string | null } | null;
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

function fmtCurrency(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function QuotesDocsListPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (search.trim()) params.set("q", search.trim());
    const r = await fetch(`/api/admin/sales-quotes?${params.toString()}`);
    const d = await r.json();
    if (r.ok) setQuotes(d.quotes || []);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/admin/login");
        else setUser(d.user);
      });
  }, [router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const counts = useMemo(() => {
    const c: Record<Status | "all", number> = {
      all: quotes.length,
      draft: 0, sent: 0, viewed: 0, accepted: 0, declined: 0, expired: 0, converted: 0,
    };
    for (const q of quotes) c[q.status] = (c[q.status] || 0) + 1;
    return c;
  }, [quotes]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Quotes</h1>
          <p className="text-sm text-catalyst-grey-500 mt-1">All sales quotes across the pipeline.</p>
        </div>
        <Link
          href="/admin/quotes-docs/new"
          className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + New Quote
        </Link>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "draft", "sent", "viewed", "accepted", "declined", "expired", "converted"] as const).map((s) => {
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? "bg-catalyst-red text-white"
                  : "bg-catalyst-card text-catalyst-grey-400 border border-catalyst-border hover:text-white"
              }`}
            >
              {s === "all" ? "All" : STATUS_LABELS[s as Status]} ({counts[s] || 0})
            </button>
          );
        })}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quote #, customer, email"
          className="ml-auto w-full sm:w-72 rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1.5 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-catalyst-black/30 text-xs uppercase tracking-wide text-catalyst-grey-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Quote #</th>
                <th className="px-4 py-2.5 text-left font-medium">Customer</th>
                <th className="px-4 py-2.5 text-left font-medium">Vehicle</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5 text-left font-medium">Created</th>
                <th className="px-4 py-2.5 text-left font-medium">Expires</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-catalyst-grey-500">Loading...</td></tr>
              )}
              {!loading && quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-catalyst-grey-500">
                    No quotes yet. Start by creating a new one or clicking <span className="text-catalyst-red">Create Quote</span> from any contact.
                  </td>
                </tr>
              )}
              {!loading && quotes.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/admin/quotes-docs/${q.id}`)}
                  className="border-t border-catalyst-border/50 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-white">{q.quote_number}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{q.quotes?.name || "—"}</div>
                    <div className="text-xs text-catalyst-grey-500">{q.quotes?.email}</div>
                  </td>
                  <td className="px-4 py-3 text-catalyst-grey-400">
                    {[q.vehicle_year, q.vehicle_make, q.vehicle_model].filter(Boolean).join(" ") || "—"}
                    <div className="text-xs text-catalyst-grey-600">{q.vehicle_size_tier} tier</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[q.status]}`}>
                      {STATUS_LABELS[q.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{fmtCurrency(q.total)}</td>
                  <td className="px-4 py-3 text-catalyst-grey-400">{fmtDate(q.created_at)}</td>
                  <td className="px-4 py-3 text-catalyst-grey-400">{fmtDate(q.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
