"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface LineItem {
  id: number;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  is_taxable: boolean;
  sort_order: number;
}

interface PublicQuote {
  id: number;
  quote_number: string;
  status: string;
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
  terms: string | null;
  expires_at: string | null;
  created_at: string;
  accepted_at: string | null;
  accepted_by_name: string | null;
  sales_quote_line_items: LineItem[];
  quotes: { name: string; email: string; phone: string | null } | null;
}

interface Settings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
  logo_url: string | null;
}

function money(n: number | null | undefined): string {
  if (n == null) return "$0.00";
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function PublicQuotePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<PublicQuote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string>("");
  const [expired, setExpired] = useState(false);
  const [declined, setDeclined] = useState(false);

  const [acceptName, setAcceptName] = useState("");
  const [acceptBox, setAcceptBox] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/public/quotes/${token}`);
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Quote unavailable.");
      if (d.expired) setExpired(true);
      if (d.declined) setDeclined(true);
    } else {
      setQuote(d.quote);
      setSettings(d.settings);
      if (d.quote.status === "accepted") {
        setAccepted(true);
        setAcceptName(d.quote.accepted_by_name || "");
      }
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function submitAccept() {
    if (!acceptName.trim() || !acceptBox) return;
    setSubmitting(true);
    const r = await fetch(`/api/public/quotes/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: acceptName.trim(), accepted: true }),
    });
    const d = await r.json();
    setSubmitting(false);
    if (!r.ok) {
      setError(d.error || "Could not record acceptance — please try again or call us.");
      return;
    }
    setAccepted(true);
  }

  // Chrome is plain HTML so the styling doesn't require the admin layout
  if (loading) {
    return <Chrome><div style={{ padding: 40, textAlign: "center" }}>Loading your quote...</div></Chrome>;
  }

  if (expired) {
    return (
      <Chrome settings={settings}>
        <Hero title="Quote expired" intro="This quote is no longer valid." />
        <p style={pStyle}>
          Please contact us at{" "}
          <a href={`tel:${settings?.business_phone || ""}`} style={linkStyle}>
            {settings?.business_phone || "our office"}
          </a>{" "}
          for a new quote and we&rsquo;ll take care of you right away.
        </p>
      </Chrome>
    );
  }

  if (declined || !quote || !settings) {
    return (
      <Chrome settings={settings}>
        <Hero title="Quote unavailable" intro={error || "This quote is no longer available."} />
        <p style={pStyle}>
          Please contact us at{" "}
          <a href={`tel:${settings?.business_phone || ""}`} style={linkStyle}>
            {settings?.business_phone || "our office"}
          </a>
          .
        </p>
      </Chrome>
    );
  }

  // Happy-path render
  const vehicle = [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(" ");

  return (
    <Chrome settings={settings}>
      {/* Expiration banner */}
      {quote.expires_at && !accepted && (
        <div style={{ background: "#FFF7E6", border: "1px solid #F5C97B", borderRadius: 8, padding: "12px 16px", marginBottom: 20, color: "#8A5A00", fontSize: 14 }}>
          This quote is valid until <strong>{fmtDate(quote.expires_at)}</strong>.
        </div>
      )}

      {accepted ? (
        <div style={{ background: "#E8F7EE", border: "1px solid #2E7D32", borderRadius: 8, padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px", color: "#1B5E20" }}>
            Thanks{acceptName ? `, ${acceptName.split(" ")[0]}` : ""} — we&rsquo;ve got it.
          </h2>
          <p style={{ margin: 0, color: "#2E7D32", fontSize: 15 }}>
            Your acceptance is on file. Our team will be in touch shortly to schedule your appointment.
          </p>
        </div>
      ) : null}

      {/* Title + meta */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#999", marginBottom: 4 }}>Quote</div>
          <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700 }}>{quote.quote_number}</div>
        </div>
        <div style={{ textAlign: "right", color: "#666", fontSize: 13 }}>
          <div>Issued: {fmtDate(quote.created_at)}</div>
          {quote.expires_at && <div>Expires: {fmtDate(quote.expires_at)}</div>}
        </div>
      </div>

      {/* Customer + Vehicle cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <Card title="Bill To">
          <div style={{ fontWeight: 600 }}>{quote.quotes?.name}</div>
          <div style={{ color: "#555", fontSize: 13 }}>{quote.quotes?.email}</div>
          {quote.quotes?.phone && <div style={{ color: "#555", fontSize: 13 }}>{quote.quotes.phone}</div>}
        </Card>
        <Card title="Vehicle">
          <div>{vehicle || "—"}</div>
          <div style={{ color: "#666", fontSize: 13 }}>
            {quote.vehicle_color ? `${quote.vehicle_color} · ` : ""}
            {quote.vehicle_size_tier} tier
          </div>
        </Card>
      </div>

      {/* Line items */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginBottom: 8 }}>
        <thead>
          <tr style={{ background: "#111", color: "#fff" }}>
            <th style={{ padding: "8px 12px", textAlign: "left" }}>Description</th>
            <th style={{ padding: "8px 12px", textAlign: "right", width: 60 }}>Qty</th>
            <th style={{ padding: "8px 12px", textAlign: "right", width: 100 }}>Unit</th>
            <th style={{ padding: "8px 12px", textAlign: "right", width: 100 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {quote.sales_quote_line_items.map((li) => (
            <tr key={li.id} style={{ borderBottom: "1px solid #EAEAEA" }}>
              <td style={{ padding: "10px 12px" }}>
                {li.description}
                {!li.is_taxable && <span style={{ color: "#999", fontSize: 12 }}> (non-taxable)</span>}
              </td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{li.quantity}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{money(li.unit_price)}</td>
              <td style={{ padding: "10px 12px", textAlign: "right" }}>{money(li.line_total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ marginLeft: "auto", maxWidth: 320, background: "#F8F8F8", padding: 16, borderRadius: 8, fontSize: 14, marginTop: 12 }}>
        <Row label="Subtotal" value={money(quote.subtotal)} />
        {quote.discount_amount > 0 && (
          <Row
            label={`Discount${quote.discount_reason ? ` (${quote.discount_reason})` : ""}`}
            value={`−${money(quote.discount_amount)}`}
          />
        )}
        <Row label={`Tax (${(quote.tax_rate * 100).toFixed(2)}%)`} value={money(quote.tax_amount)} />
        <Row label="Total" value={money(quote.total)} strong />
        {quote.deposit_type !== "none" && quote.deposit_amount_calc != null && (
          <>
            <Row
              label={`Deposit due${quote.deposit_type === "percent" && quote.deposit_value != null ? ` (${quote.deposit_value}%)` : ""}`}
              value={money(quote.deposit_amount_calc)}
              accent
            />
            <Row label="Balance on completion" value={money(quote.total - quote.deposit_amount_calc)} />
          </>
        )}
      </div>

      {/* Notes */}
      {quote.customer_notes && (
        <div style={{ marginTop: 24 }}>
          <h3 style={sectionHeaderStyle}>Notes</h3>
          <p style={{ ...pStyle, whiteSpace: "pre-wrap" }}>{quote.customer_notes}</p>
        </div>
      )}

      {/* Terms */}
      {quote.terms && (
        <div style={{ marginTop: 20 }}>
          <h3 style={sectionHeaderStyle}>Terms</h3>
          <p style={{ ...pStyle, whiteSpace: "pre-wrap", fontSize: 13, color: "#555" }}>{quote.terms}</p>
        </div>
      )}

      {/* Acceptance block */}
      {!accepted && (
        <div style={{ marginTop: 28, padding: 20, border: "1px solid #E10600", borderRadius: 8, background: "#FFF9F9" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>Accept this quote</h3>
          <label style={{ display: "block", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "#666", marginBottom: 4 }}>
            Type your full legal name
          </label>
          <input
            type="text"
            value={acceptName}
            onChange={(e) => setAcceptName(e.target.value)}
            placeholder="Full name"
            style={{
              width: "100%",
              border: "1px solid #ccc",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 15,
              marginBottom: 12,
              boxSizing: "border-box",
            }}
          />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, lineHeight: 1.4, marginBottom: 16, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={acceptBox}
              onChange={(e) => setAcceptBox(e.target.checked)}
              style={{ marginTop: 3 }}
            />
            <span>I accept this quote and agree to the terms listed above.</span>
          </label>
          {error && <div style={{ color: "#C62828", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          <button
            onClick={submitAccept}
            disabled={!acceptName.trim() || !acceptBox || submitting}
            style={{
              background: acceptName.trim() && acceptBox && !submitting ? "#E10600" : "#E8E8E8",
              color: acceptName.trim() && acceptBox && !submitting ? "#fff" : "#999",
              border: 0,
              borderRadius: 6,
              padding: "12px 24px",
              fontSize: 15,
              fontWeight: 600,
              cursor: acceptName.trim() && acceptBox && !submitting ? "pointer" : "not-allowed",
              width: "100%",
            }}
          >
            {submitting ? "Submitting..." : "Accept Quote"}
          </button>
        </div>
      )}
    </Chrome>
  );
}

// Chrome & helpers ------------------------------------------------------------

function Chrome({ children, settings }: { children: React.ReactNode; settings?: Settings | null }) {
  return (
    <div style={{ background: "#F8F8F8", minHeight: "100vh", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif", color: "#111" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
          {/* Header */}
          <div style={{ padding: "20px 32px", borderBottom: "2px solid #E10600", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            {settings?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logo_url} alt={settings?.business_name || "Catalyst Motorsport"} style={{ height: 36 }} />
            ) : (
              <div style={{ fontSize: 22, fontWeight: 700, color: "#E10600", letterSpacing: 1 }}>
                {(settings?.business_name || "CATALYST MOTORSPORT").toUpperCase()}
              </div>
            )}
            {settings && (
              <div style={{ textAlign: "right", fontSize: 12, color: "#666", lineHeight: 1.5 }}>
                <div>{settings.business_phone}</div>
                <div>{settings.business_website}</div>
              </div>
            )}
          </div>

          <div style={{ padding: 32 }}>{children}</div>

          {settings && (
            <div style={{ padding: "16px 32px", borderTop: "1px solid #EAEAEA", color: "#666", fontSize: 12, lineHeight: 1.5 }}>
              <strong style={{ color: "#111" }}>{settings.business_name}</strong> · {settings.business_address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Hero({ title, intro }: { title: string; intro: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px" }}>{title}</h1>
      <p style={{ color: "#666", margin: 0 }}>{intro}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#F8F8F8", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#666", fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14 }}>{children}</div>
    </div>
  );
}

function Row({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderTop: strong ? "1px solid #111" : "none", paddingTop: strong ? 8 : 3, marginTop: strong ? 8 : 0 }}>
      <span style={{ color: accent ? "#E10600" : "#666", fontWeight: strong ? 700 : 400 }}>{label}</span>
      <span style={{ color: accent ? "#E10600" : "#111", fontWeight: strong ? 700 : 500, fontSize: strong ? 16 : 14 }}>{value}</span>
    </div>
  );
}

const pStyle: React.CSSProperties = { fontSize: 14, lineHeight: 1.55, margin: "8px 0", color: "#111" };
const sectionHeaderStyle: React.CSSProperties = { fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#666", fontWeight: 600, margin: "0 0 6px" };
const linkStyle: React.CSSProperties = { color: "#E10600", textDecoration: "none" };
