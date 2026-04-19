import { supabase } from "@/lib/supabase";
import type { QuotePDFData } from "./QuotePDF";

/**
 * Fetch a sales quote with line items, contact, and invoicing settings,
 * and shape the data for <QuotePDF>. Returns null if the quote doesn't exist.
 */
export async function buildQuotePDFData(quoteId: number): Promise<QuotePDFData | null> {
  const [{ data: quote }, { data: settings }] = await Promise.all([
    supabase
      .from("sales_quotes")
      .select(`
        *,
        sales_quote_line_items ( id, description, quantity, unit_price, line_total, is_taxable, sort_order ),
        quotes:contact_id ( id, name, email, phone )
      `)
      .eq("id", quoteId)
      .single(),
    supabase
      .from("invoicing_settings")
      .select("business_name, business_address, business_phone, business_website, logo_url")
      .eq("id", 1)
      .single(),
  ]);

  if (!quote || !quote.quotes || !settings) return null;

  const items = [...(quote.sales_quote_line_items || [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

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
    line_items: items.map((li) => ({
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
}

/**
 * Server-side render a QuotePDF to a Buffer suitable for email attachment.
 * Imports react-pdf lazily so edge-incompatible code is never pulled into
 * middleware bundles.
 */
export async function renderQuotePDFBuffer(data: QuotePDFData): Promise<Buffer> {
  const [{ renderToBuffer }, { QuotePDF }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("./QuotePDF"),
  ]);
  return await renderToBuffer(<QuotePDF data={data} />);
}
