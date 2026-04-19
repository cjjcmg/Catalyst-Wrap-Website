"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "draft" | "sent_to_square" | "pending_payment" | "paid" | "void";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft", sent_to_square: "Sent", pending_payment: "Pending", paid: "Paid", void: "Void",
};

const STATUS_COLORS: Record<Status, string> = {
  draft: "bg-catalyst-grey-500/15 text-catalyst-grey-300",
  sent_to_square: "bg-blue-500/15 text-blue-400",
  pending_payment: "bg-amber-500/15 text-amber-400",
  paid: "bg-green-500/15 text-green-400",
  void: "bg-red-500/15 text-red-400",
};

interface Invoice {
  id: number;
  invoice_number: string;
  type: "deposit" | "balance" | "full";
  status: Status;
  amount: number;
  square_invoice_id: string | null;
  square_public_url: string | null;
  sent_to_square_at: string | null;
  paid_at: string | null;
  created_at: string;
  sales_quote_id: number;
  contact_id: number;
  sales_quotes: { id: number; quote_number: string; total: number; status: string } | null;
  quotes: { id: number; name: string; email: string; phone: string | null } | null;
}

interface Payment {
  id: number;
  invoice_id: number;
  amount: number;
  square_payment_id: string | null;
  payment_method: string | null;
  paid_at: string;
  raw_webhook_payload: unknown;
  created_at: string;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

function money(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPayload, setShowPayload] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/invoices/${id}`);
    const d = await r.json();
    if (r.ok && d.invoice) {
      setInvoice(d.invoice);
      setPayments(d.payments || []);
    } else {
      setError(d.error || "Failed to load");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
  }, [router]);

  useEffect(() => { if (user && id) load(); }, [user, id, load]);

  async function copyPayLink() {
    if (!invoice?.square_public_url) return;
    await navigator.clipboard.writeText(invoice.square_public_url);
    setMessage("Pay link copied to clipboard.");
    setTimeout(() => setMessage(""), 2000);
  }

  async function voidInvoice() {
    if (!invoice || user?.role !== "admin") return;
    if (!confirm(`Void ${invoice.invoice_number}? This cancels the invoice on Square and marks it void locally.`)) return;
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/invoices/${id}/void`, { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Failed"); return; }
    await load();
  }

  async function deleteInvoice() {
    if (!invoice || user?.role !== "admin") return;
    const msg = `Permanently delete ${invoice.invoice_number} and its ${payments.length} payment row${payments.length === 1 ? "" : "s"} from the local database?\n\nThis does NOT touch Square — if the invoice exists there, you'll need to void or refund it separately on the Square dashboard.\n\nType DELETE to confirm:`;
    const confirmation = window.prompt(msg);
    if (confirmation !== "DELETE") return;
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/invoices/${id}`, { method: "DELETE" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Delete failed"); return; }
    router.push("/admin/invoices");
  }

  async function syncFromSquare() {
    if (!invoice) return;
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/invoices/${id}/sync`, { method: "POST" });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Sync failed"); return; }
    if (d.synced) {
      setMessage(`Synced from Square: ${d.previous_status} → ${d.new_status} (${d.payments_inserted} new payment row${d.payments_inserted === 1 ? "" : "s"}).`);
    } else {
      setMessage("Already in sync with Square.");
    }
    setTimeout(() => setMessage(""), 4000);
    await load();
  }

  async function refundInvoice() {
    if (!invoice || user?.role !== "admin") return;
    const amountStr = prompt(`Refund amount (max $${Number(invoice.amount).toFixed(2)}). Leave blank for full refund:`);
    if (amountStr === null) return;
    const reason = prompt("Reason (optional):") || undefined;
    const amount = amountStr.trim() === "" ? undefined : Number(amountStr);
    if (amount !== undefined && (Number.isNaN(amount) || amount <= 0)) { setError("Invalid amount"); return; }
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/invoices/${id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Refund failed"); return; }
    setMessage(`Refunded $${Number(d.refund_amount).toFixed(2)}.`);
    setTimeout(() => setMessage(""), 3000);
    await load();
  }

  if (loading || !user) return <div className="p-6 text-catalyst-grey-500">Loading...</div>;
  if (!invoice) return <div className="p-6 text-catalyst-grey-500">{error || "Not found"}</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <button
          onClick={() => router.push("/admin/invoices")}
          className="text-catalyst-grey-500 hover:text-white text-sm mb-2 transition-colors"
        >
          ← All invoices
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white font-mono">{invoice.invoice_number}</h1>
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
          </span>
          <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-catalyst-grey-500/15 text-catalyst-grey-300 capitalize">
            {invoice.type}
          </span>
          <span className="text-xl font-bold text-white">{money(Number(invoice.amount))}</span>
        </div>
        {invoice.quotes && (
          <p className="text-sm text-catalyst-grey-400 mt-1">
            <Link href={`/admin/crm/contacts/${invoice.quotes.id}`} className="hover:text-catalyst-red">{invoice.quotes.name}</Link>
            {" · "}
            {invoice.quotes.email}
            {" · Quote "}
            <Link href={`/admin/quotes-docs/${invoice.sales_quote_id}`} className="hover:text-catalyst-red font-mono">{invoice.sales_quotes?.quote_number}</Link>
          </p>
        )}
      </div>

      {(message || error) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400"}`}>
          {error || message}
        </div>
      )}

      {/* Actions */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-white">Actions</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {invoice.square_public_url && (
            <>
              <Action
                title="Open on Square"
                description="Customer-facing payment URL."
                button={<a href={invoice.square_public_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Open ↗</a>}
              />
              <Action
                title="Copy pay link"
                description="Paste into an email or text for the customer."
                button={<button onClick={copyPayLink} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Copy</button>}
              />
            </>
          )}
          {user.role === "admin" && invoice.status !== "paid" && invoice.status !== "void" && (
            <Action
              title="Void"
              description="Cancels on Square and marks this invoice void locally. If Square already marked the invoice paid (webhook missed), this button reconciles local state and suggests a refund instead."
              button={<button onClick={voidInvoice} disabled={busy} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">{busy ? "..." : "Void"}</button>}
            />
          )}
          {invoice.square_invoice_id && invoice.status !== "void" && (
            <Action
              title="Sync from Square"
              description="Pull the authoritative invoice state from Square and update local records. Use this if you know payment happened but the dashboard still shows pending (webhook missed, signature mismatch, etc.)."
              button={<button onClick={syncFromSquare} disabled={busy} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-40">{busy ? "..." : "Sync"}</button>}
            />
          )}
          {user.role === "admin" && (
            <Action
              title="Delete locally (admin)"
              description="Wipe this invoice and its payment rows from the Catalyst database. Does NOT touch Square — use this for test invoices or mistaken records. If this is the quote's only invoice, the quote reverts from Converted to Accepted."
              button={<button onClick={deleteInvoice} disabled={busy} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">{busy ? "..." : "Delete"}</button>}
            />
          )}
          {user.role === "admin" && invoice.status === "paid" && (
            <Action
              title="Refund"
              description="Issues a full or partial refund against the original Square payment."
              button={<button onClick={refundInvoice} disabled={busy} className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40">{busy ? "..." : "Refund"}</button>}
            />
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
        <h2 className="font-heading text-lg font-semibold text-white">Payment history</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-catalyst-grey-500 italic">No payments recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="rounded-lg border border-catalyst-border/50 bg-catalyst-black/40 p-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className={`text-base font-semibold ${Number(p.amount) < 0 ? "text-amber-400" : "text-green-400"}`}>
                      {Number(p.amount) < 0 ? "−" : ""}{money(Math.abs(Number(p.amount)))}
                    </span>
                    <span className="text-xs text-catalyst-grey-500">{p.payment_method || "—"}</span>
                    <span className="text-xs text-catalyst-grey-500">{new Date(p.paid_at).toLocaleString("en-US")}</span>
                  </div>
                  {p.raw_webhook_payload != null && (
                    <button
                      onClick={() => setShowPayload(showPayload === p.id ? null : p.id)}
                      className="text-xs text-catalyst-grey-400 hover:text-white underline"
                    >
                      {showPayload === p.id ? "Hide raw payload" : "Show raw payload"}
                    </button>
                  )}
                </div>
                {p.square_payment_id && (
                  <div className="text-xs text-catalyst-grey-600 mt-1 font-mono">Square payment id: {p.square_payment_id}</div>
                )}
                {showPayload === p.id && p.raw_webhook_payload != null && (
                  <pre className="mt-2 max-h-64 overflow-auto rounded bg-catalyst-black px-3 py-2 text-xs text-catalyst-grey-400">
                    {JSON.stringify(p.raw_webhook_payload, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Action({ title, description, button }: { title: string; description: string; button: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border border-catalyst-border/50 bg-catalyst-black/40 p-3">
      <div className="min-w-0">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-catalyst-grey-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{button}</div>
    </div>
  );
}
