"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { QuotePDFData } from "@/lib/pdf/QuotePDF";

const QuotePreview = dynamic(
  () => import("@/components/admin/QuotePreview").then((m) => m.QuotePreview),
  { ssr: false, loading: () => <div className="text-catalyst-grey-500 p-6 text-sm">Loading preview...</div> }
);

type Status = "draft" | "sent" | "viewed" | "accepted" | "declined" | "expired" | "converted";

const STATUS_LABELS: Record<Status, string> = {
  draft: "Draft", sent: "Sent", viewed: "Viewed", accepted: "Accepted",
  declined: "Declined", expired: "Expired", converted: "Converted",
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

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_taxable: boolean;
  sort_order: number;
}

interface SalesQuote {
  id: number;
  quote_number: string;
  status: Status;
  contact_id: number;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_size_tier: string;
  subtotal: number;
  discount_amount: number;
  discount_reason: string | null;
  tax_rate: number;
  tax_amount: number;
  total: number;
  deposit_type: "none" | "fixed_amount" | "percent";
  deposit_value: number | null;
  deposit_amount_calc: number | null;
  customer_notes: string | null;
  internal_notes: string | null;
  terms: string | null;
  expires_at: string | null;
  public_token: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  accepted_by_name: string | null;
  accepted_ip: string | null;
  accepted_user_agent: string | null;
  created_at: string;
  updated_at: string;
  assigned_agent_id: number | null;
  sales_quote_line_items: LineItem[];
  quotes: { id: number; name: string; email: string; phone: string | null } | null;
}

interface Activity {
  id: number;
  activity_type: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  users?: { name: string } | null;
}

interface InvoicingSettings {
  logo_url: string | null;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

type Tab = "preview" | "activity" | "actions";

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [quote, setQuote] = useState<SalesQuote | null>(null);
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("preview");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/sales-quotes/${id}`);
    const d = await r.json();
    if (r.ok && d.quote) {
      setQuote(d.quote);
      const a = await fetch(`/api/admin/crm/activities?quote_id=${d.quote.contact_id}`);
      const ad = await a.json();
      if (a.ok) {
        const qn = d.quote.quote_number;
        setActivities((ad.activities || []).filter((x: Activity) =>
          x.subject?.includes(qn) || (x.metadata as { quote_number?: string })?.quote_number === qn
        ));
      }
    } else {
      setError(d.error || "Failed to load quote");
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
    fetch("/api/admin/invoicing-settings").then((r) => r.json()).then((d) => {
      if (d.settings) setSettings(d.settings);
    });
  }, [router]);

  useEffect(() => {
    if (user && id) load();
  }, [user, id, load]);


  const pdfData: QuotePDFData | null = useMemo(() => {
    if (!quote || !settings || !quote.quotes) return null;
    return {
      quote: {
        quote_number: quote.quote_number,
        status: quote.status,
        created_at: quote.created_at,
        expires_at: quote.expires_at,
        vehicle_year: quote.vehicle_year,
        vehicle_make: quote.vehicle_make,
        vehicle_model: quote.vehicle_model,
        vehicle_color: quote.vehicle_color,
        vehicle_size_tier: quote.vehicle_size_tier,
        subtotal: Number(quote.subtotal),
        discount_amount: Number(quote.discount_amount),
        discount_reason: quote.discount_reason,
        tax_rate: Number(quote.tax_rate),
        tax_amount: Number(quote.tax_amount),
        total: Number(quote.total),
        deposit_type: quote.deposit_type,
        deposit_value: quote.deposit_value == null ? null : Number(quote.deposit_value),
        deposit_amount_calc: quote.deposit_amount_calc == null ? null : Number(quote.deposit_amount_calc),
        customer_notes: quote.customer_notes,
        terms: quote.terms,
        accepted_at: quote.accepted_at,
        accepted_by_name: quote.accepted_by_name,
        accepted_ip: quote.accepted_ip,
      },
      line_items: (quote.sales_quote_line_items || []).map((li) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        line_total: Number(li.line_total),
        is_taxable: li.is_taxable,
        sort_order: li.sort_order,
      })),
      contact: {
        name: quote.quotes.name,
        email: quote.quotes.email,
        phone: quote.quotes.phone,
      },
      settings: {
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_phone: settings.business_phone,
        business_website: settings.business_website,
        logo_url: settings.logo_url,
      },
    };
  }, [quote, settings]);

  async function patchStatus(status: Status, extras?: Record<string, unknown>) {
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/sales-quotes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(extras || {}) }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Failed"); return; }
    await load();
  }

  async function copyPublicLink() {
    if (!quote) return;
    const base = window.location.origin;
    const url = `${base}/quotes/${quote.public_token}`;
    await navigator.clipboard.writeText(url);
    setError("Public link copied to clipboard.");
    setTimeout(() => setError(""), 2000);
  }

  async function sendQuote(resend: boolean) {
    if (!quote || !pdfData) return;
    const note = resend ? undefined : (window.prompt(
      "Optional personal note to include in the email (leave blank for the default copy):",
      ""
    ) ?? undefined);
    setBusy(true);
    setError("");
    try {
      // Render the PDF in the browser so server doesn't need to touch react-pdf
      const { renderQuotePDFBlob } = await import("@/lib/pdf/client-render");
      const blob = await renderQuotePDFBlob(pdfData);

      const fd = new FormData();
      fd.append("pdf", blob, `${quote.quote_number}.pdf`);
      if (note && note.trim()) fd.append("note", note.trim());
      fd.append("resend_only", resend ? "1" : "0");

      const r = await fetch(`/api/admin/sales-quotes/${id}/send`, { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to send");
      const smsNote = d.sms_sent ? " SMS also sent." : "";
      setError(resend ? `Email re-sent.${smsNote}` : `Quote sent to customer.${smsNote}`);
      setTimeout(() => setError(""), 3000);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  async function duplicateQuote() {
    if (!quote) return;
    setBusy(true);
    const payload = {
      contact_id: quote.contact_id,
      vehicle_size_tier: quote.vehicle_size_tier,
      vehicle_year: quote.vehicle_year,
      vehicle_make: quote.vehicle_make,
      vehicle_model: quote.vehicle_model,
      vehicle_color: quote.vehicle_color,
      assigned_agent_id: quote.assigned_agent_id,
      tax_rate: Number(quote.tax_rate),
      discount_amount: Number(quote.discount_amount),
      discount_reason: quote.discount_reason,
      deposit_type: quote.deposit_type,
      deposit_value: quote.deposit_value,
      customer_notes: quote.customer_notes,
      internal_notes: quote.internal_notes,
      terms: quote.terms,
      line_items: quote.sales_quote_line_items.map((li, idx) => ({
        product_id: null,
        description: li.description,
        quantity: Number(li.quantity),
        unit_price: Number(li.unit_price),
        is_taxable: li.is_taxable,
        sort_order: idx * 10,
      })),
    };
    const r = await fetch("/api/admin/sales-quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    setBusy(false);
    if (r.ok && d.quote) router.push(`/admin/quotes-docs/${d.quote.id}`);
    else setError(d.error || "Failed to duplicate");
  }

  async function deleteQuote() {
    if (!quote || user?.role !== "admin") return;
    if (!confirm(`Delete ${quote.quote_number}? This cannot be undone.`)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/sales-quotes/${id}`, { method: "DELETE" });
    const d = await r.json();
    setBusy(false);
    if (r.ok) router.push("/admin/quotes-docs");
    else setError(d.error || "Failed to delete");
  }

  async function markAcceptedManually() {
    const name = prompt("Customer name for in-person acceptance:");
    if (!name) return;
    await patchStatus("accepted", {
      accepted_by_name: name.trim(),
      accepted_at: new Date().toISOString(),
    });
  }

  async function cancelAcceptance() {
    if (!quote || user?.role !== "admin") return;
    const reason = prompt(
      `Cancel acceptance on ${quote.quote_number}? This will revert the quote to draft, wipe the signature, and remove the auto-generated "send invoice" reminder.\n\nOptionally enter a reason (shown in the activity feed):`
    );
    if (reason === null) return; // user cancelled the prompt itself
    setBusy(true);
    setError("");
    const r = await fetch(`/api/admin/sales-quotes/${id}/cancel-acceptance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reason.trim() || null }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) { setError(d.error || "Failed to cancel acceptance"); return; }
    setError("Acceptance cancelled — quote is now a draft.");
    setTimeout(() => setError(""), 3000);
    await load();
  }

  if (loading || !user) return <div className="p-6 text-catalyst-grey-500">Loading...</div>;
  if (!quote) return <div className="p-6 text-catalyst-grey-500">{error || "Not found"}</div>;

  const statusColor = STATUS_COLORS[quote.status];

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <button
            onClick={() => router.push("/admin/quotes-docs")}
            className="text-catalyst-grey-500 hover:text-white text-sm mb-1 transition-colors"
          >
            ← All quotes
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white font-mono">{quote.quote_number}</h1>
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColor}`}>
              {STATUS_LABELS[quote.status]}
            </span>
            <span className="text-xl font-bold text-white">${Number(quote.total).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
          </div>
          {quote.quotes && (
            <p className="text-sm text-catalyst-grey-400 mt-1">
              <Link href={`/admin/crm/contacts/${quote.quotes.id}`} className="hover:text-catalyst-red">{quote.quotes.name}</Link>
              {" · "}
              {quote.quotes.email}
              {quote.quotes.phone ? ` · ${quote.quotes.phone}` : ""}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-catalyst-border">
        {(["preview", "activity", "actions"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-catalyst-red text-white"
                : "border-transparent text-catalyst-grey-400 hover:text-white"
            }`}
          >
            {t === "preview" ? "Preview" : t === "activity" ? "Activity" : "Actions"}
          </button>
        ))}
      </div>

      {tab === "preview" && (
        <div className="rounded-xl overflow-hidden border border-catalyst-border h-[80vh]">
          {pdfData ? (
            <QuotePreview data={pdfData} />
          ) : (
            <div className="p-6 text-catalyst-grey-500">Preview unavailable.</div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
          {/* Status timeline */}
          <div className="space-y-2 text-sm mb-6">
            <TimelineRow label="Created" timestamp={quote.created_at} />
            {quote.sent_at && <TimelineRow label="Sent" timestamp={quote.sent_at} />}
            {quote.viewed_at && <TimelineRow label="Viewed by customer" timestamp={quote.viewed_at} />}
            {quote.accepted_at && (
              <TimelineRow
                label={`Accepted by ${quote.accepted_by_name || "(unknown)"}`}
                timestamp={quote.accepted_at}
                detail={quote.accepted_ip ? `IP ${quote.accepted_ip}` : undefined}
              />
            )}
            {quote.declined_at && <TimelineRow label="Declined" timestamp={quote.declined_at} />}
            {quote.expires_at && <TimelineRow label="Expires" timestamp={quote.expires_at} />}
          </div>

          {/* Related CRM activities */}
          <h3 className="font-heading text-sm font-semibold text-white mb-2">Related CRM activity</h3>
          {activities.length === 0 ? (
            <p className="text-xs text-catalyst-grey-500 italic">No CRM activities yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {activities.map((a) => (
                <li key={a.id} className="text-xs text-catalyst-grey-300 flex items-start gap-2">
                  <span className="text-catalyst-grey-600 font-mono whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                  <span>{a.subject}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "actions" && (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 space-y-3">
          {quote.status === "draft" && (
            <>
              <ActionCard
                title="Send to customer"
                description="Email the quote PDF + acceptance link. Transitions the quote to 'sent' and starts the 30-day expiration clock."
                button={<button onClick={() => sendQuote(false)} disabled={busy} className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40">{busy ? "Sending…" : "Send"}</button>}
              />
              <ActionCard
                title="Edit this draft"
                description="Change line items, adjustments, deposit, or notes. Only drafts can be edited — sent or accepted quotes are locked."
                button={<Link href={`/admin/quotes-docs/${id}/edit`} className="inline-block rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Edit draft</Link>}
              />
            </>
          )}

          {(quote.status === "sent" || quote.status === "viewed") && (
            <>
              <ActionCard
                title="Resend email"
                description="Re-send the same PDF + acceptance link. Does not reset the expiration date."
                button={<button onClick={() => sendQuote(true)} disabled={busy} className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40">{busy ? "Sending…" : "Resend"}</button>}
              />
              <ActionCard
                title="Copy public link"
                description="Share the acceptance URL directly (e.g. if the email bounces)."
                button={<button onClick={copyPublicLink} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors">Copy link</button>}
              />
              <ActionCard
                title="Mark accepted manually"
                description="Use this if the customer accepted in person. Triggers the same CRM flow as public acceptance."
                button={<button onClick={markAcceptedManually} disabled={busy} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-40">Mark accepted</button>}
              />
              <ActionCard
                title="Mark declined / cancel"
                description="Flip to 'declined' — the contact will advance to 'lost' unless already further along the pipeline."
                button={<button onClick={() => patchStatus("declined")} disabled={busy} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">Mark declined</button>}
              />
            </>
          )}

          {quote.status === "accepted" && (
            <>
              <ActionCard
                title="Send to Square"
                description="Create a Square invoice for deposit, balance, or full amount. Lands in Phase 4."
                button={<button disabled className="rounded-lg bg-catalyst-grey-500/20 px-4 py-2 text-sm text-catalyst-grey-500 cursor-not-allowed">Send to Square (Phase 4)</button>}
              />
              {user.role === "admin" && (
                <ActionCard
                  title="Cancel acceptance (admin)"
                  description="Reverts the quote to draft, wipes the signature, and removes the auto-generated 'send invoice' reminder. Refuses if any invoice already references the quote."
                  button={<button onClick={cancelAcceptance} disabled={busy} className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-40">Cancel acceptance</button>}
                />
              )}
            </>
          )}

          <ActionCard
            title="Duplicate"
            description="Create a new draft with identical line items and adjustments, linked to the same contact."
            button={<button onClick={duplicateQuote} disabled={busy} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-40">Duplicate</button>}
          />

          {user.role === "admin" && (
            <ActionCard
              title="Delete"
              description="Permanently remove this quote. Only allowed while no invoice references it."
              button={<button onClick={deleteQuote} disabled={busy} className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">Delete quote</button>}
            />
          )}
        </div>
      )}
    </div>
  );
}

function TimelineRow({ label, timestamp, detail }: { label: string; timestamp: string; detail?: string }) {
  const d = new Date(timestamp);
  return (
    <div className="flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-catalyst-red flex-shrink-0" />
      <span className="text-white font-medium">{label}</span>
      <span className="text-catalyst-grey-500 text-xs">
        {d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
      </span>
      {detail && <span className="text-catalyst-grey-600 text-xs">· {detail}</span>}
    </div>
  );
}

function ActionCard({ title, description, button }: { title: string; description: string; button: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-catalyst-border/50 last:border-b-0">
      <div>
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs text-catalyst-grey-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{button}</div>
    </div>
  );
}
