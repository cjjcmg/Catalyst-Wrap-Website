"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { QuotePDFData } from "@/lib/pdf/QuotePDF";

// react-pdf needs browser APIs; load dynamically with SSR off.
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((m) => m.PDFViewer),
  { ssr: false, loading: () => <div className="text-catalyst-grey-500 text-sm">Loading preview...</div> }
);
const QuotePDF = dynamic(
  () => import("@/lib/pdf/QuotePDF").then((m) => m.QuotePDF),
  { ssr: false }
);

type SizeTier = "small" | "mid" | "suv" | "truck" | "exotic";
type Category = "wrap" | "ppf" | "ceramic" | "detail";
type DepositType = "none" | "fixed_amount" | "percent";

const SIZE_TIERS: { id: SizeTier; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "mid", label: "Mid" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "exotic", label: "Exotic" },
];

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  vehicle: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  contact_tag: string | null;
  contact_status: string | null;
  assigned_agent_id: number | null;
  source: string | null;
}

interface Product {
  id: number;
  category: Category;
  name: string;
  description: string | null;
  is_taxable: boolean;
  product_pricing: { size_tier: SizeTier; default_price: number }[];
}

interface LineItem {
  key: string; // local id
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  is_taxable: boolean;
}

interface InvoicingSettings {
  default_tax_rate: number;
  default_expiration_days: number;
  default_terms: string | null;
  logo_url: string | null;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user"; }

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-6 text-catalyst-grey-500">Loading…</div>}>
      <NewQuoteInner />
    </Suspense>
  );
}

function NewQuoteInner() {
  const router = useRouter();
  const search = useSearchParams();
  const contactIdParam = search.get("contactId");

  const [user, setUser] = useState<SessionUser | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<InvoicingSettings | null>(null);

  const [loadingContact, setLoadingContact] = useState(!!contactIdParam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [vehYear, setVehYear] = useState("");
  const [vehMake, setVehMake] = useState("");
  const [vehModel, setVehModel] = useState("");
  const [vehColor, setVehColor] = useState("");
  const [sizeTier, setSizeTier] = useState<SizeTier>("mid");
  const [assignedAgent, setAssignedAgent] = useState<number | null>(null);

  const [items, setItems] = useState<LineItem[]>([]);

  const [discount, setDiscount] = useState<string>("0");
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountReason, setDiscountReason] = useState("");
  const [taxRate, setTaxRate] = useState("0.0775");

  const [depositType, setDepositType] = useState<DepositType>("none");
  const [depositValue, setDepositValue] = useState("");

  const [customerNotes, setCustomerNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [terms, setTerms] = useState("");

  const [showPreview, setShowPreview] = useState(false);

  // Load session + invariant data
  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
    fetch("/api/admin/products").then((r) => r.json()).then((d) => setProducts(d.products || []));
    fetch("/api/admin/invoicing-settings").then((r) => r.json()).then((d) => {
      if (d.settings) {
        setSettings(d.settings);
        setTaxRate(String(d.settings.default_tax_rate ?? 0.0775));
        setTerms(d.settings.default_terms ?? "");
      }
    });
  }, [router]);

  // Pre-fill from contact
  useEffect(() => {
    if (!contactIdParam) return;
    setLoadingContact(true);
    fetch(`/api/admin/contacts/${contactIdParam}`).then((r) => r.json()).then((d) => {
      if (d.contact) {
        setContact(d.contact);
        setVehYear(d.contact.vehicle_year || "");
        setVehMake(d.contact.vehicle_make || "");
        setVehModel(d.contact.vehicle_model || "");
        setVehColor(d.contact.vehicle_color || "");
        setAssignedAgent(d.contact.assigned_agent_id ?? null);
      } else {
        setError(d.error || "Contact not found");
      }
      setLoadingContact(false);
    });
  }, [contactIdParam]);

  // Totals (matches trigger math)
  const totals = useMemo(() => {
    const subtotal = items.reduce((s, li) => s + li.quantity * li.unit_price, 0);
    const taxableSub = items.reduce((s, li) => s + (li.is_taxable ? li.quantity * li.unit_price : 0), 0);
    let discountAmount = 0;
    const d = Number(discount) || 0;
    if (discountMode === "amount") discountAmount = d;
    else discountAmount = +(subtotal * (d / 100)).toFixed(2);
    const effectiveTaxable = subtotal > 0
      ? Math.max(0, taxableSub - (discountAmount * taxableSub) / subtotal)
      : 0;
    const rate = Number(taxRate) || 0;
    const tax = +(effectiveTaxable * rate).toFixed(2);
    const total = +(subtotal - discountAmount + tax).toFixed(2);
    let deposit: number | null = null;
    const dv = Number(depositValue) || 0;
    if (depositType === "fixed_amount") deposit = dv;
    else if (depositType === "percent") deposit = +(total * (dv / 100)).toFixed(2);
    return { subtotal, discountAmount, tax, total, deposit };
  }, [items, discount, discountMode, taxRate, depositType, depositValue]);

  // Preview data
  const previewData: QuotePDFData | null = useMemo(() => {
    if (!contact || !settings) return null;
    return {
      quote: {
        quote_number: "DRAFT",
        status: "draft",
        created_at: new Date().toISOString(),
        expires_at: null,
        vehicle_year: vehYear || null,
        vehicle_make: vehMake || null,
        vehicle_model: vehModel || null,
        vehicle_color: vehColor || null,
        vehicle_size_tier: sizeTier,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        discount_reason: discountReason || null,
        tax_rate: Number(taxRate) || 0,
        tax_amount: totals.tax,
        total: totals.total,
        deposit_type: depositType,
        deposit_value: depositType !== "none" ? Number(depositValue) || 0 : null,
        deposit_amount_calc: totals.deposit,
        customer_notes: customerNotes || null,
        terms: terms || null,
        accepted_at: null,
        accepted_by_name: null,
        accepted_ip: null,
      },
      line_items: items.map((li, idx) => ({
        id: idx + 1,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        line_total: +(li.quantity * li.unit_price).toFixed(2),
        is_taxable: li.is_taxable,
        sort_order: idx * 10,
      })),
      contact: {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      },
      settings: {
        business_name: settings.business_name,
        business_address: settings.business_address,
        business_phone: settings.business_phone,
        business_website: settings.business_website,
        logo_url: settings.logo_url,
      },
    };
  }, [contact, settings, vehYear, vehMake, vehModel, vehColor, sizeTier, totals,
      discountReason, taxRate, depositType, depositValue, customerNotes, terms, items]);

  const productsByCategory = useMemo(() => {
    const g: Record<Category, Product[]> = { wrap: [], ppf: [], ceramic: [], detail: [] };
    for (const p of products) g[p.category].push(p);
    return g;
  }, [products]);

  function priceFor(p: Product): number {
    const row = p.product_pricing.find((r) => r.size_tier === sizeTier);
    return row ? Number(row.default_price) : 0;
  }

  function addFromProduct(p: Product) {
    setItems((prev) => [
      ...prev,
      {
        key: uid(),
        product_id: p.id,
        description: p.name,
        quantity: 1,
        unit_price: priceFor(p),
        is_taxable: p.is_taxable,
      },
    ]);
  }

  function addManual() {
    setItems((prev) => [
      ...prev,
      { key: uid(), product_id: null, description: "", quantity: 1, unit_price: 0, is_taxable: true },
    ]);
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((li) => (li.key === key ? { ...li, ...patch } : li)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((li) => li.key !== key));
  }

  async function save(sendAfter: boolean) {
    if (!contact) { setError("No contact selected"); return; }
    if (items.length === 0) { setError("Add at least one line item"); return; }
    if (items.some((li) => !li.description.trim())) { setError("All line items need a description"); return; }
    setSaving(true);
    setError("");

    const payload = {
      contact_id: contact.id,
      vehicle_size_tier: sizeTier,
      vehicle_year: vehYear || null,
      vehicle_make: vehMake || null,
      vehicle_model: vehModel || null,
      vehicle_color: vehColor || null,
      assigned_agent_id: assignedAgent,
      tax_rate: Number(taxRate) || 0,
      discount_amount: totals.discountAmount,
      discount_reason: discountReason || null,
      deposit_type: depositType,
      deposit_value: depositType !== "none" ? Number(depositValue) || 0 : null,
      customer_notes: customerNotes || null,
      internal_notes: internalNotes || null,
      terms: terms || null,
      line_items: items.map((li, idx) => ({
        product_id: li.product_id,
        description: li.description.trim(),
        quantity: li.quantity,
        unit_price: li.unit_price,
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
    if (!r.ok || !d.quote) {
      setSaving(false);
      setError(d.error || "Failed to save");
      return;
    }

    // Phase 3 will expose a /send endpoint — for now, routing to detail either way.
    if (sendAfter) {
      router.push(`/admin/quotes-docs/${d.quote.id}?send=1`);
    } else {
      router.push(`/admin/quotes-docs/${d.quote.id}`);
    }
  }

  if (!user) return null;
  if (loadingContact) return <div className="p-6 text-catalyst-grey-500">Loading contact…</div>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">New Quote</h1>
          {contact ? (
            <p className="text-sm text-catalyst-grey-500">
              For <Link href={`/admin/crm/contacts/${contact.id}`} className="text-catalyst-red hover:underline">{contact.name}</Link>
            </p>
          ) : (
            <p className="text-sm text-catalyst-grey-500">Select a contact from the <Link href="/admin/crm/contacts" className="text-catalyst-red">CRM</Link> and click Create Quote.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-catalyst-grey-300 hover:text-white transition-colors"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || !contact}
            className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save draft"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving || !contact}
            className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            Save & send
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "grid-cols-1"}`}>
        <div className="space-y-5">
          {/* Customer */}
          {contact && (
            <Section title="Customer">
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <KV label="Name" value={contact.name} />
                <KV label="Email" value={contact.email} />
                <KV label="Phone" value={contact.phone || "—"} />
                <KV label="Tag / Status" value={`${contact.contact_tag || "—"} • ${contact.contact_status || "—"}`} />
              </div>
            </Section>
          )}

          {/* Vehicle */}
          <Section title="Vehicle">
            <div className="grid sm:grid-cols-4 gap-3">
              <Field label="Year"><input value={vehYear} onChange={(e) => setVehYear(e.target.value)} className={inputCls} /></Field>
              <Field label="Make"><input value={vehMake} onChange={(e) => setVehMake(e.target.value)} className={inputCls} /></Field>
              <Field label="Model"><input value={vehModel} onChange={(e) => setVehModel(e.target.value)} className={inputCls} /></Field>
              <Field label="Color"><input value={vehColor} onChange={(e) => setVehColor(e.target.value)} className={inputCls} /></Field>
            </div>
            <Field label="Size tier" hint="Determines catalog pricing defaults">
              <div className="flex gap-1">
                {SIZE_TIERS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSizeTier(t.id)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      sizeTier === t.id
                        ? "bg-catalyst-red border-catalyst-red text-white"
                        : "border-catalyst-border bg-catalyst-black text-catalyst-grey-300 hover:text-white"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Line items */}
          <Section title="Line items">
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-xs text-catalyst-grey-500 italic">No items yet. Add one from the catalog or enter manually.</p>
              )}
              {items.map((li) => (
                <div key={li.key} className="grid grid-cols-12 gap-2 items-start">
                  <input
                    value={li.description}
                    onChange={(e) => updateItem(li.key, { description: e.target.value })}
                    placeholder="Description"
                    className={`${inputCls} col-span-5`}
                  />
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={li.quantity}
                    onChange={(e) => updateItem(li.key, { quantity: Number(e.target.value) || 1 })}
                    className={`${inputCls} col-span-1 text-right`}
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={li.unit_price}
                    onChange={(e) => updateItem(li.key, { unit_price: Number(e.target.value) || 0 })}
                    className={`${inputCls} col-span-2 text-right`}
                  />
                  <div className="col-span-2 text-right text-sm text-white py-2 pr-1">
                    ${(li.quantity * li.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <label className="col-span-1 flex items-center justify-center gap-1 text-xs text-catalyst-grey-400 py-2">
                    <input
                      type="checkbox"
                      checked={li.is_taxable}
                      onChange={(e) => updateItem(li.key, { is_taxable: e.target.checked })}
                    />
                    Tax
                  </label>
                  <button
                    onClick={() => removeItem(li.key)}
                    className="col-span-1 text-catalyst-grey-500 hover:text-red-400 transition-colors py-2"
                    title="Remove line"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={addManual}
                  className="rounded-lg border border-catalyst-border px-3 py-1.5 text-xs text-catalyst-grey-300 hover:text-white transition-colors"
                >
                  + Manual line
                </button>
                <details className="relative">
                  <summary className="list-none rounded-lg border border-catalyst-border px-3 py-1.5 text-xs text-catalyst-grey-300 hover:text-white transition-colors cursor-pointer">
                    + From catalog ({sizeTier} prices)
                  </summary>
                  <div className="absolute z-10 mt-1 w-96 max-h-96 overflow-auto rounded-lg border border-catalyst-border bg-catalyst-card shadow-xl">
                    {(["wrap", "ppf", "ceramic", "detail"] as const).map((cat) => (
                      <div key={cat} className="border-b border-catalyst-border/50 last:border-b-0">
                        <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-catalyst-grey-500 bg-catalyst-black/40">
                          {cat === "ppf" ? "PPF" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </div>
                        {productsByCategory[cat].map((p) => {
                          const price = priceFor(p);
                          return (
                            <button
                              key={p.id}
                              onClick={() => addFromProduct(p)}
                              className="w-full text-left px-3 py-2 hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                            >
                              <span className="text-sm text-white">{p.name}</span>
                              <span className="text-xs text-catalyst-grey-400">${price.toLocaleString("en-US")}</span>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          </Section>

          {/* Adjustments */}
          <Section title="Adjustments">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Discount">
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className={`${inputCls} flex-1`}
                  />
                  <button
                    onClick={() => setDiscountMode((m) => (m === "amount" ? "percent" : "amount"))}
                    className="rounded-lg border border-catalyst-border px-3 text-sm text-catalyst-grey-300 hover:text-white transition-colors"
                  >
                    {discountMode === "amount" ? "$" : "%"}
                  </button>
                </div>
              </Field>
              <Field label="Discount reason">
                <input value={discountReason} onChange={(e) => setDiscountReason(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Tax rate (decimal)">
                <input type="number" step="0.0001" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className={inputCls} />
              </Field>
            </div>
          </Section>

          {/* Deposit */}
          <Section title="Deposit">
            <div className="flex gap-2 flex-wrap">
              {(["none", "fixed_amount", "percent"] as DepositType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setDepositType(t)}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    depositType === t ? "bg-catalyst-red border-catalyst-red text-white" : "border-catalyst-border text-catalyst-grey-300 hover:text-white"
                  }`}
                >
                  {t === "none" ? "None" : t === "fixed_amount" ? "Fixed $" : "% of total"}
                </button>
              ))}
            </div>
            {depositType !== "none" && (
              <Field label={depositType === "fixed_amount" ? "Amount" : "Percent"}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={depositValue}
                  onChange={(e) => setDepositValue(e.target.value)}
                  className={inputCls}
                />
                {totals.deposit != null && (
                  <p className="text-xs text-catalyst-grey-500 mt-1">
                    Deposit calculated: ${totals.deposit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </Field>
            )}
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <Field label="Customer-visible notes">
              <textarea rows={3} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Internal notes (not shown to customer)">
              <textarea rows={2} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} className={inputCls} />
            </Field>
          </Section>

          <Section title="Terms">
            <textarea rows={5} value={terms} onChange={(e) => setTerms(e.target.value)} className={inputCls} />
          </Section>

          {/* Totals rollup */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-black/40 p-4 space-y-1 text-sm">
            <Row label="Subtotal" value={`$${totals.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
            {totals.discountAmount > 0 && <Row label="Discount" value={`−$${totals.discountAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />}
            <Row label={`Tax (${(Number(taxRate) * 100).toFixed(2)}%)`} value={`$${totals.tax.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
            <div className="border-t border-catalyst-border mt-2 pt-2">
              <Row label="Total" value={`$${totals.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} bold />
            </div>
            {totals.deposit != null && (
              <Row label="Deposit due" value={`$${totals.deposit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} accent />
            )}
          </div>
        </div>

        {showPreview && (
          <div className="sticky top-36 h-[80vh] rounded-xl overflow-hidden border border-catalyst-border">
            {previewData ? (
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <QuotePDF data={previewData} />
              </PDFViewer>
            ) : (
              <div className="p-6 text-catalyst-grey-500 text-sm">Add a contact and line items to preview the PDF.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 space-y-3">
      <h2 className="font-heading text-base font-semibold text-white">{title}</h2>
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

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-xs text-catalyst-grey-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-white text-right truncate">{value}</span>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${bold ? "text-white font-semibold" : accent ? "text-catalyst-red" : "text-catalyst-grey-400"}`}>{label}</span>
      <span className={`${bold ? "text-white font-bold text-base" : accent ? "text-catalyst-red" : "text-white"}`}>{value}</span>
    </div>
  );
}
