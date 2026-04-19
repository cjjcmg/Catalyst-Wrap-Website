"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { QuotePDFData } from "@/lib/pdf/QuotePDF";

const QuotePreview = dynamic(
  () => import("@/components/admin/QuotePreview").then((m) => m.QuotePreview),
  { ssr: false, loading: () => <div className="text-catalyst-grey-500 text-sm">Loading preview...</div> }
);

export type SizeTier = "small" | "mid" | "suv" | "truck" | "exotic";
export type Category = "wrap" | "ppf" | "ceramic" | "detail";
export type DepositType = "none" | "fixed_amount" | "percent";

const SIZE_TIERS: { id: SizeTier; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "mid", label: "Mid" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "exotic", label: "Exotic" },
];

export interface EditorContact {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  contact_tag: string | null;
  contact_status: string | null;
  assigned_agent_id: number | null;
}

export interface EditorProduct {
  id: number;
  category: Category;
  name: string;
  description: string | null;
  is_taxable: boolean;
  product_pricing: { size_tier: SizeTier; default_price: number }[];
}

export interface EditorSettings {
  default_tax_rate: number;
  default_expiration_days: number;
  default_terms: string | null;
  logo_url: string | null;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_website: string;
}

export interface EditorInitialQuote {
  id: number;
  quote_number: string;
  status: string;
  vehicle_year: string | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_size_tier: SizeTier;
  tax_rate: number;
  discount_amount: number;
  discount_reason: string | null;
  deposit_type: DepositType;
  deposit_value: number | null;
  customer_notes: string | null;
  internal_notes: string | null;
  terms: string | null;
  assigned_agent_id: number | null;
  sales_quote_line_items: Array<{
    id: number;
    product_id: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    is_taxable: boolean;
    sort_order: number;
  }>;
}

export interface SessionUserShape {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

interface LineItem {
  key: string;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: number;
  is_taxable: boolean;
}

interface Props {
  user: SessionUserShape;
  contact: EditorContact;
  products: EditorProduct[];
  settings: EditorSettings;
  /** Provide to run the editor in "edit" mode. Absence = "create" mode. */
  initialQuote?: EditorInitialQuote;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function QuoteEditor({ user, contact, products, settings, initialQuote }: Props) {
  const router = useRouter();
  const editMode = !!initialQuote;

  // Form state (pre-populated from initialQuote when editing, else from contact/settings)
  const [vehYear, setVehYear] = useState(initialQuote?.vehicle_year ?? contact.vehicle_year ?? "");
  const [vehMake, setVehMake] = useState(initialQuote?.vehicle_make ?? contact.vehicle_make ?? "");
  const [vehModel, setVehModel] = useState(initialQuote?.vehicle_model ?? contact.vehicle_model ?? "");
  const [vehColor, setVehColor] = useState(initialQuote?.vehicle_color ?? contact.vehicle_color ?? "");
  const [sizeTier, setSizeTier] = useState<SizeTier>(initialQuote?.vehicle_size_tier ?? "mid");
  const [assignedAgent, setAssignedAgent] = useState<number | null>(
    initialQuote?.assigned_agent_id ?? contact.assigned_agent_id ?? null
  );

  const [items, setItems] = useState<LineItem[]>(() =>
    (initialQuote?.sales_quote_line_items ?? []).map((li) => ({
      key: uid(),
      product_id: li.product_id,
      description: li.description,
      quantity: Number(li.quantity),
      unit_price: Number(li.unit_price),
      is_taxable: li.is_taxable,
    }))
  );

  // Initial discount value is stored as absolute amount on the DB; we default
  // the mode to "amount" on edit and let the user switch.
  const [discount, setDiscount] = useState<string>(
    initialQuote ? String(initialQuote.discount_amount ?? 0) : "0"
  );
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountReason, setDiscountReason] = useState(initialQuote?.discount_reason ?? "");
  const [taxRate, setTaxRate] = useState<string>(
    String(initialQuote?.tax_rate ?? settings.default_tax_rate ?? 0.0775)
  );

  const [depositType, setDepositType] = useState<DepositType>(initialQuote?.deposit_type ?? "none");
  const [depositValue, setDepositValue] = useState<string>(
    initialQuote?.deposit_value != null ? String(initialQuote.deposit_value) : ""
  );

  const [customerNotes, setCustomerNotes] = useState(initialQuote?.customer_notes ?? "");
  const [internalNotes, setInternalNotes] = useState(initialQuote?.internal_notes ?? "");
  const [terms, setTerms] = useState(initialQuote?.terms ?? settings.default_terms ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!catalogOpen) return;
    function onDocClick(e: MouseEvent) {
      if (catalogRef.current && !catalogRef.current.contains(e.target as Node)) {
        setCatalogOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [catalogOpen]);

  // Live totals (mirrors DB trigger math)
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

  const previewData: QuotePDFData = useMemo(() => ({
    quote: {
      quote_number: initialQuote?.quote_number ?? "DRAFT",
      status: initialQuote?.status ?? "draft",
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
    contact: { name: contact.name, email: contact.email, phone: contact.phone },
    settings: {
      business_name: settings.business_name,
      business_address: settings.business_address,
      business_phone: settings.business_phone,
      business_website: settings.business_website,
      logo_url: settings.logo_url,
    },
  }), [contact, settings, initialQuote, vehYear, vehMake, vehModel, vehColor, sizeTier, totals,
      discountReason, taxRate, depositType, depositValue, customerNotes, terms, items]);

  const productsByCategory = useMemo(() => {
    const g: Record<Category, EditorProduct[]> = { wrap: [], ppf: [], ceramic: [], detail: [] };
    for (const p of products) g[p.category].push(p);
    return g;
  }, [products]);

  function priceFor(p: EditorProduct): number {
    const row = p.product_pricing.find((r) => r.size_tier === sizeTier);
    return row ? Number(row.default_price) : 0;
  }

  function addFromProduct(p: EditorProduct) {
    setItems((prev) => [...prev, {
      key: uid(),
      product_id: p.id,
      description: p.name,
      quantity: 1,
      unit_price: priceFor(p),
      is_taxable: p.is_taxable,
    }]);
    setCatalogOpen(false);
  }

  function addManual() {
    setItems((prev) => [...prev, {
      key: uid(), product_id: null, description: "", quantity: 1, unit_price: 0, is_taxable: true,
    }]);
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((li) => (li.key === key ? { ...li, ...patch } : li)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((li) => li.key !== key));
  }

  async function save(sendAfter: boolean) {
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

    const url = editMode
      ? `/api/admin/sales-quotes/${initialQuote!.id}`
      : "/api/admin/sales-quotes";
    const method = editMode ? "PUT" : "POST";

    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok || !d.quote) {
      setSaving(false);
      setError(d.error || "Failed to save");
      return;
    }
    const savedId = d.quote.id as number;
    const savedQuoteNumber = d.quote.quote_number as string;

    if (sendAfter) {
      try {
        // Re-fetch fully populated quote (with DB-computed totals + line items)
        const fr = await fetch(`/api/admin/sales-quotes/${savedId}`);
        const fd_ = await fr.json();
        if (!fr.ok || !fd_.quote) throw new Error("Saved, but couldn't read back for send.");
        const q = fd_.quote;

        const finalPdfData: QuotePDFData = {
          quote: {
            quote_number: q.quote_number,
            status: q.status,
            created_at: q.created_at,
            expires_at: q.expires_at,
            vehicle_year: q.vehicle_year,
            vehicle_make: q.vehicle_make,
            vehicle_model: q.vehicle_model,
            vehicle_color: q.vehicle_color,
            vehicle_size_tier: q.vehicle_size_tier,
            subtotal: Number(q.subtotal),
            discount_amount: Number(q.discount_amount),
            discount_reason: q.discount_reason,
            tax_rate: Number(q.tax_rate),
            tax_amount: Number(q.tax_amount),
            total: Number(q.total),
            deposit_type: q.deposit_type,
            deposit_value: q.deposit_value == null ? null : Number(q.deposit_value),
            deposit_amount_calc: q.deposit_amount_calc == null ? null : Number(q.deposit_amount_calc),
            customer_notes: q.customer_notes,
            terms: q.terms,
            accepted_at: null,
            accepted_by_name: null,
            accepted_ip: null,
          },
          line_items: (q.sales_quote_line_items || []).map((li: { id: number; description: string; quantity: number; unit_price: number; line_total: number; is_taxable: boolean; sort_order: number }) => ({
            id: li.id,
            description: li.description,
            quantity: Number(li.quantity),
            unit_price: Number(li.unit_price),
            line_total: Number(li.line_total),
            is_taxable: li.is_taxable,
            sort_order: li.sort_order,
          })),
          contact: { name: contact.name, email: contact.email, phone: contact.phone },
          settings: {
            business_name: settings.business_name,
            business_address: settings.business_address,
            business_phone: settings.business_phone,
            business_website: settings.business_website,
            logo_url: settings.logo_url,
          },
        };

        const { renderQuotePDFBlob } = await import("@/lib/pdf/client-render");
        const blob = await renderQuotePDFBlob(finalPdfData);

        const fd = new FormData();
        fd.append("pdf", blob, `${savedQuoteNumber}.pdf`);
        fd.append("resend_only", "0");
        const sr = await fetch(`/api/admin/sales-quotes/${savedId}/send`, { method: "POST", body: fd });
        const sd = await sr.json();
        if (!sr.ok) throw new Error(sd.error || "Send failed");
      } catch (err) {
        setSaving(false);
        setError(err instanceof Error ? err.message : "Saved, but send failed — try again from the detail page.");
        router.push(`/admin/quotes-docs/${savedId}`);
        return;
      }
    }
    router.push(`/admin/quotes-docs/${savedId}`);
  }

  const title = editMode ? `Edit ${initialQuote!.quote_number}` : "New Quote";
  const subtitle = editMode
    ? <>For <Link href={`/admin/crm/contacts/${contact.id}`} className="text-catalyst-red hover:underline">{contact.name}</Link> · Draft</>
    : <>For <Link href={`/admin/crm/contacts/${contact.id}`} className="text-catalyst-red hover:underline">{contact.name}</Link></>;

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-catalyst-grey-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPreview((v) => !v)}
            className="hidden lg:inline-block rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-catalyst-grey-300 hover:text-white transition-colors"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving}
            className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-40 flex-1 sm:flex-none"
          >
            {saving ? "Saving..." : editMode ? "Save changes" : "Save draft"}
          </button>
          <button
            onClick={() => save(true)}
            disabled={saving}
            className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40 flex-1 sm:flex-none"
          >
            {editMode ? "Save & send" : "Save & send"}
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
          <Section title="Customer">
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <KV label="Name" value={contact.name} />
              <KV label="Email" value={contact.email} />
              <KV label="Phone" value={contact.phone || "—"} />
              <KV label="Tag / Status" value={`${contact.contact_tag || "—"} • ${contact.contact_status || "—"}`} />
            </div>
          </Section>

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

          <Section title="Line items">
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-xs text-catalyst-grey-500 italic">No items yet. Add one from the catalog or enter manually.</p>
              )}
              {items.map((li) => (
                <div key={li.key} className="rounded-lg border border-catalyst-border/50 bg-catalyst-black/20 p-3 sm:p-0 sm:border-0 sm:bg-transparent sm:grid sm:grid-cols-12 sm:gap-2 sm:items-start space-y-2 sm:space-y-0">
                  <input
                    value={li.description}
                    onChange={(e) => updateItem(li.key, { description: e.target.value })}
                    placeholder="Description"
                    className={`${inputCls} sm:col-span-5`}
                  />
                  <div className="flex items-center gap-2 sm:contents">
                    <label className="sm:hidden text-xs text-catalyst-grey-500 uppercase tracking-wide w-12">Qty</label>
                    <input
                      type="number" step="0.5" min="0.5"
                      value={li.quantity}
                      onChange={(e) => updateItem(li.key, { quantity: Number(e.target.value) || 1 })}
                      className={`${inputCls} sm:col-span-1 text-right`}
                      aria-label="Quantity"
                    />
                    <label className="sm:hidden text-xs text-catalyst-grey-500 uppercase tracking-wide w-12">Price</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={li.unit_price}
                      onChange={(e) => updateItem(li.key, { unit_price: Number(e.target.value) || 0 })}
                      className={`${inputCls} sm:col-span-2 text-right`}
                      aria-label="Unit price"
                    />
                  </div>
                  <div className="flex items-center justify-between sm:contents">
                    <div className="sm:col-span-2 sm:text-right text-sm text-white sm:py-2 sm:pr-1">
                      <span className="sm:hidden text-xs text-catalyst-grey-500 uppercase tracking-wide mr-2">Line total</span>
                      ${(li.quantity * li.unit_price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <label className="sm:col-span-1 flex items-center justify-center gap-1 text-xs text-catalyst-grey-400 sm:py-2">
                      <input type="checkbox" checked={li.is_taxable} onChange={(e) => updateItem(li.key, { is_taxable: e.target.checked })} />
                      Tax
                    </label>
                    <button onClick={() => removeItem(li.key)} className="sm:col-span-1 text-catalyst-grey-500 hover:text-red-400 transition-colors sm:py-2" title="Remove line" aria-label="Remove line">✕</button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2">
                <button onClick={addManual} className="rounded-lg border border-catalyst-border px-3 py-1.5 text-xs text-catalyst-grey-300 hover:text-white transition-colors">
                  + Manual line
                </button>
                <div ref={catalogRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setCatalogOpen((v) => !v)}
                    className="rounded-lg border border-catalyst-border px-3 py-1.5 text-xs text-catalyst-grey-300 hover:text-white transition-colors"
                  >
                    + From catalog ({sizeTier} prices)
                  </button>
                  {catalogOpen && (
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
                                type="button"
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
                  )}
                </div>
              </div>
            </div>
          </Section>

          <Section title="Adjustments">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Discount">
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className={`${inputCls} flex-1`} />
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
                <input type="number" step="0.01" min="0" value={depositValue} onChange={(e) => setDepositValue(e.target.value)} className={inputCls} />
                {totals.deposit != null && (
                  <p className="text-xs text-catalyst-grey-500 mt-1">
                    Deposit calculated: ${totals.deposit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </Field>
            )}
          </Section>

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

          {/* user-role hint is only useful for admin-only behaviors we might add later; keep reference to `user` live */}
          <p className="sr-only">{user.role}</p>
        </div>

        {showPreview && (
          <div className="sticky top-36 h-[80vh] rounded-xl overflow-hidden border border-catalyst-border">
            <QuotePreview data={previewData} />
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
