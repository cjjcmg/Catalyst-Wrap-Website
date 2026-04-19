"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "draft" | "sent_to_square" | "pending_payment" | "paid" | "void";
type InvoiceType = "deposit" | "balance" | "full";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft",
  sent_to_square: "Sent",
  pending_payment: "Pending",
  paid: "Paid",
  void: "Void",
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "bg-catalyst-grey-500/15 text-catalyst-grey-300",
  sent_to_square: "bg-blue-500/15 text-blue-400",
  pending_payment: "bg-amber-500/15 text-amber-400",
  paid: "bg-green-500/15 text-green-400",
  void: "bg-red-500/15 text-red-400",
};

interface InvoiceRow {
  id: number;
  invoice_number: string;
  type: InvoiceType;
  status: Status;
  amount: number;
  paid_at: string | null;
  sent_to_square_at: string | null;
  square_invoice_id: string | null;
  square_public_url: string | null;
  sales_quote_id: number;
  created_at: string;
  sales_quotes: { quote_number: string } | null;
  quotes: { id: number; name: string; email: string } | null;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

function money(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function InvoicesListPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const r = await fetch(`/api/admin/invoices?${params.toString()}`);
    const d = await r.json();
    if (r.ok) setInvoices(d.invoices || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
  }, [router]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const counts = useMemo(() => {
    const c: Record<Status | "all", number> = {
      all: invoices.length, draft: 0, sent_to_square: 0, pending_payment: 0, paid: 0, void: 0,
    };
    for (const i of invoices) c[i.status] = (c[i.status] || 0) + 1;
    return c;
  }, [invoices]);

  const outstanding = useMemo(() =>
    invoices.filter((i) => i.status === "pending_payment").reduce((s, i) => s + Number(i.amount), 0)
  , [invoices]);

  const paidInRange = useMemo(() =>
    invoices.filter((i) => i.status === "paid").reduce((s, i) => s + Number(i.amount), 0)
  , [invoices]);

  async function copyPayLink(inv: InvoiceRow) {
    if (!inv.square_public_url) return;
    await navigator.clipboard.writeText(inv.square_public_url);
    setCopied(inv.id);
    setTimeout(() => setCopied(null), 1500);
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Invoices</h1>
          <p className="text-sm text-catalyst-grey-500 mt-1">Square invoices created from accepted quotes.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <div className="rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-2">
            <div className="text-xs uppercase tracking-wide text-catalyst-grey-500">Outstanding</div>
            <div className="text-lg font-bold text-amber-400">{money(outstanding)}</div>
          </div>
          <div className="rounded-lg border border-catalyst-border bg-catalyst-card px-4 py-2">
            <div className="text-xs uppercase tracking-wide text-catalyst-grey-500">Paid</div>
            <div className="text-lg font-bold text-green-400">{money(paidInRange)}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "draft", "sent_to_square", "pending_payment", "paid", "void"] as const).map((s) => {
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
      </div>

      <div className="rounded-xl border border-catalyst-border bg-catalyst-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-catalyst-black/30 text-xs uppercase tracking-wide text-catalyst-grey-500">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Invoice #</th>
                <th className="px-4 py-2.5 text-left font-medium">Quote</th>
                <th className="px-4 py-2.5 text-left font-medium">Customer</th>
                <th className="px-4 py-2.5 text-left font-medium">Type</th>
                <th className="px-4 py-2.5 text-left font-medium">Status</th>
                <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                <th className="px-4 py-2.5 text-left font-medium">Paid</th>
                <th className="px-4 py-2.5 text-right font-medium w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={8} className="px-4 py-8 text-center text-catalyst-grey-500">Loading...</td></tr>)}
              {!loading && invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-catalyst-grey-500">
                    No invoices yet. Invoices are created from accepted quotes — open a quote and click <span className="text-catalyst-red">Send to Square</span>.
                  </td>
                </tr>
              )}
              {!loading && invoices.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                  className="border-t border-catalyst-border/50 cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-white">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-mono text-xs text-catalyst-grey-400">{inv.sales_quotes?.quote_number || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{inv.quotes?.name || "—"}</div>
                    <div className="text-xs text-catalyst-grey-500">{inv.quotes?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold bg-catalyst-grey-500/15 text-catalyst-grey-300 capitalize">
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[inv.status]}`}>
                      {STATUS_LABELS[inv.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-white">{money(Number(inv.amount))}</td>
                  <td className="px-4 py-3 text-catalyst-grey-400">{fmtDate(inv.paid_at)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {inv.square_public_url ? (
                      <button
                        onClick={() => copyPayLink(inv)}
                        className="rounded-lg border border-catalyst-border px-2 py-1 text-xs text-catalyst-grey-300 hover:text-white transition-colors"
                      >
                        {copied === inv.id ? "Copied!" : "Copy pay link"}
                      </button>
                    ) : (
                      <span className="text-xs text-catalyst-grey-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
