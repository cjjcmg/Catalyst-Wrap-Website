import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { token } = await params;
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const { data: quote, error } = await supabase
    .from("sales_quotes")
    .select(`
      id, quote_number, status, public_token,
      vehicle_year, vehicle_make, vehicle_model, vehicle_color, vehicle_size_tier,
      subtotal, discount_amount, discount_reason, tax_rate, tax_amount, total,
      deposit_type, deposit_value, deposit_amount_calc,
      customer_notes, terms, expires_at, created_at,
      accepted_at, accepted_by_name,
      sales_quote_line_items ( id, description, quantity, unit_price, line_total, is_taxable, sort_order ),
      quotes:contact_id ( name, email, phone )
    `)
    .eq("public_token", token)
    .single();

  if (error || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  // Enforce gating
  const now = Date.now();
  const expired = quote.expires_at && new Date(quote.expires_at).getTime() < now;
  if (quote.status === "draft") {
    return NextResponse.json({ error: "This quote is not available yet." }, { status: 403 });
  }
  if (quote.status === "declined") {
    return NextResponse.json({ error: "This quote has been cancelled.", declined: true }, { status: 403 });
  }
  if (quote.status === "expired" || expired) {
    return NextResponse.json(
      { error: "This quote has expired. Please contact us for a new quote.", expired: true },
      { status: 410 }
    );
  }

  // Load settings for branding
  const { data: settings } = await supabase
    .from("invoicing_settings")
    .select("business_name, business_address, business_phone, business_website, logo_url")
    .eq("id", 1)
    .single();

  // Mark as viewed on first public GET
  if (quote.status === "sent") {
    await supabase
      .from("sales_quotes")
      .update({ status: "viewed", viewed_at: new Date().toISOString() })
      .eq("id", quote.id);
  }

  // Sort line items
  const items = [...(quote.sales_quote_line_items || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return NextResponse.json({
    quote: { ...quote, sales_quote_line_items: items },
    settings,
  });
}
