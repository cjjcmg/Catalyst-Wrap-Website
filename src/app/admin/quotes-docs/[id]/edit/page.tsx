"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  QuoteEditor,
  type EditorContact,
  type EditorInitialQuote,
  type EditorProduct,
  type EditorSettings,
  type SessionUserShape,
} from "@/components/admin/QuoteEditor";

export default function EditQuotePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qid = Number(params.id);

  const [user, setUser] = useState<SessionUserShape | null>(null);
  const [contact, setContact] = useState<EditorContact | null>(null);
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [settings, setSettings] = useState<EditorSettings | null>(null);
  const [initialQuote, setInitialQuote] = useState<EditorInitialQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const meRes = await fetch("/api/admin/me");
      const meData = await meRes.json();
      if (cancelled) return;
      if (!meData.user) { router.replace("/admin/login"); return; }
      setUser(meData.user);

      const [quoteRes, prodRes, settingsRes] = await Promise.all([
        fetch(`/api/admin/sales-quotes/${qid}`),
        fetch("/api/admin/products"),
        fetch("/api/admin/invoicing-settings"),
      ]);
      const [quoteData, prodData, settingsData] = await Promise.all([
        quoteRes.json(), prodRes.json(), settingsRes.json(),
      ]);
      if (cancelled) return;

      if (!quoteRes.ok || !quoteData.quote) {
        setError(quoteData.error || "Quote not found");
        setLoading(false);
        return;
      }

      const q = quoteData.quote;
      if (q.status !== "draft") {
        setError(`This quote is '${q.status}'. Only draft quotes can be edited — duplicate first if you need to change a sent or accepted quote.`);
        setLoading(false);
        return;
      }

      // Fetch the full contact record
      const cRes = await fetch(`/api/admin/contacts/${q.contact_id}`);
      const cData = await cRes.json();
      if (cancelled) return;
      if (!cRes.ok || !cData.contact) {
        setError(cData.error || "Contact not found");
        setLoading(false);
        return;
      }

      setContact(cData.contact);
      setProducts(prodData.products || []);
      if (settingsData.settings) setSettings(settingsData.settings);
      setInitialQuote({
        id: q.id,
        quote_number: q.quote_number,
        status: q.status,
        vehicle_year: q.vehicle_year,
        vehicle_make: q.vehicle_make,
        vehicle_model: q.vehicle_model,
        vehicle_color: q.vehicle_color,
        vehicle_size_tier: q.vehicle_size_tier,
        tax_rate: Number(q.tax_rate),
        discount_amount: Number(q.discount_amount),
        discount_reason: q.discount_reason,
        deposit_type: q.deposit_type,
        deposit_value: q.deposit_value == null ? null : Number(q.deposit_value),
        customer_notes: q.customer_notes,
        internal_notes: q.internal_notes,
        terms: q.terms,
        assigned_agent_id: q.assigned_agent_id,
        sales_quote_line_items: (q.sales_quote_line_items || []).map((li: { id: number; product_id: number | null; description: string; quantity: number; unit_price: number; is_taxable: boolean; sort_order: number }) => ({
          id: li.id,
          product_id: li.product_id,
          description: li.description,
          quantity: Number(li.quantity),
          unit_price: Number(li.unit_price),
          is_taxable: li.is_taxable,
          sort_order: li.sort_order,
        })),
      });
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [qid, router]);

  if (loading) return <div className="p-6 text-catalyst-grey-500">Loading…</div>;
  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <p className="text-catalyst-grey-400">{error}</p>
        <Link href={`/admin/quotes-docs/${qid}`} className="text-catalyst-red hover:underline">Back to quote</Link>
      </div>
    );
  }
  if (!user || !contact || !settings || !initialQuote) return null;

  return <QuoteEditor user={user} contact={contact} products={products} settings={settings} initialQuote={initialQuote} />;
}
