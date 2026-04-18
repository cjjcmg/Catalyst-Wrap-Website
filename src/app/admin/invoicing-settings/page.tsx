"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  default_tax_rate: number;
  default_expiration_days: number;
  default_terms: string | null;
  logo_url: string | null;
  square_location_id: string | null;
  notification_email: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

function toForm(s: Settings) {
  return {
    default_tax_rate: String(s.default_tax_rate ?? ""),
    default_expiration_days: String(s.default_expiration_days ?? ""),
    default_terms: s.default_terms ?? "",
    logo_url: s.logo_url ?? "",
    square_location_id: s.square_location_id ?? "",
    notification_email: s.notification_email ?? "",
    business_name: s.business_name ?? "",
    business_address: s.business_address ?? "",
    business_phone: s.business_phone ?? "",
    business_website: s.business_website ?? "",
  };
}

export default function InvoicingSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "saved" | "error">("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<ReturnType<typeof toForm> | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/admin/login");
        else setUser(d.user);
      });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/invoicing-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setForm(toForm(d.settings));
        else setError(d.error || "Failed to load settings");
        setLoaded(true);
      });
  }, [user]);

  async function save() {
    if (!form) return;
    setSaving(true);
    setStatus("");
    setError("");
    const r = await fetch("/api/admin/invoicing-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_tax_rate: Number(form.default_tax_rate),
        default_expiration_days: Number(form.default_expiration_days),
        default_terms: form.default_terms || null,
        logo_url: form.logo_url || null,
        square_location_id: form.square_location_id || null,
        notification_email: form.notification_email,
        business_name: form.business_name,
        business_address: form.business_address,
        business_phone: form.business_phone,
        business_website: form.business_website,
      }),
    });
    setSaving(false);
    if (r.ok) {
      const d = await r.json();
      setForm(toForm(d.settings));
      setStatus("saved");
      setTimeout(() => setStatus(""), 2000);
    } else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Failed to save");
      setStatus("error");
    }
  }

  function set<K extends keyof NonNullable<typeof form>>(key: K, value: string) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Invoicing Settings</h1>
        <p className="text-sm text-catalyst-grey-500 mt-1">Defaults applied to every new quote and invoice.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {!loaded || !form ? (
        <p className="text-catalyst-grey-500">Loading...</p>
      ) : (
        <>
          <Section title="Quote defaults">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Default tax rate (decimal)" hint="e.g. 0.0775 for 7.75%">
                <input
                  type="number"
                  step="0.0001"
                  value={form.default_tax_rate}
                  onChange={(e) => set("default_tax_rate", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="Default expiration (days)">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.default_expiration_days}
                  onChange={(e) => set("default_expiration_days", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
            <Field label="Default terms">
              <textarea
                rows={5}
                value={form.default_terms}
                onChange={(e) => set("default_terms", e.target.value)}
                placeholder="Payment due on completion. Deposits are non-refundable once scheduled. ..."
                className={inputCls}
              />
            </Field>
          </Section>

          <Section title="Branding">
            <Field label="Logo URL" hint="Rendered on quote PDFs and public acceptance page">
              <input
                type="url"
                value={form.logo_url}
                onChange={(e) => set("logo_url", e.target.value)}
                placeholder="https://www.catalystmotorsport.com/images/CM_logo_wh.webp"
                className={inputCls}
              />
            </Field>
          </Section>

          <Section title="Business info (stamped on every document)">
            <Field label="Business name">
              <input type="text" value={form.business_name} onChange={(e) => set("business_name", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Address">
              <input type="text" value={form.business_address} onChange={(e) => set("business_address", e.target.value)} className={inputCls} />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone">
                <input type="text" value={form.business_phone} onChange={(e) => set("business_phone", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Website">
                <input type="text" value={form.business_website} onChange={(e) => set("business_website", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          <Section title="Notifications & payments">
            <Field label="Internal notification email" hint="Where quote acceptance and payment alerts are sent">
              <input
                type="email"
                value={form.notification_email}
                onChange={(e) => set("notification_email", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Square location ID" hint="Used when creating Square invoices">
              <input
                type="text"
                value={form.square_location_id}
                onChange={(e) => set("square_location_id", e.target.value)}
                className={inputCls}
              />
            </Field>
          </Section>

          <div className="flex items-center justify-end gap-3">
            {status === "saved" && <span className="text-sm text-green-400">Saved</span>}
            <button
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-catalyst-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-4">
      <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium uppercase tracking-wide text-catalyst-grey-500">{label}</label>
      {children}
      {hint && <p className="text-xs text-catalyst-grey-600">{hint}</p>}
    </div>
  );
}
