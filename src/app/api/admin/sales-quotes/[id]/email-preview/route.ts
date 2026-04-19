import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { quoteSentEmail } from "@/lib/email/invoicing-templates";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data: quote, error } = await supabase
    .from("sales_quotes")
    .select(`
      quote_number, total, deposit_amount_calc, expires_at, public_token,
      quotes:contact_id ( name, email )
    `)
    .eq("id", qid)
    .single();

  if (error || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const { data: settings } = await supabase
    .from("invoicing_settings")
    .select("business_name, business_address, business_phone, business_website, logo_url")
    .eq("id", 1)
    .single();
  if (!settings) return NextResponse.json({ error: "Invoicing settings missing" }, { status: 500 });

  const contact = quote.quotes as unknown as { name: string; email: string } | null;
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const acceptanceUrl = `${origin}/quotes/${quote.public_token}`;

  const { subject, html, text } = quoteSentEmail({
    customerName: contact?.name || "Customer",
    quoteNumber: quote.quote_number,
    totalAmount: Number(quote.total),
    depositAmount: quote.deposit_amount_calc == null ? null : Number(quote.deposit_amount_calc),
    expiresAt: quote.expires_at,
    acceptanceUrl,
    settings,
  });

  return NextResponse.json({
    subject,
    html,
    text,
    to: contact?.email || "",
    acceptanceUrl,
  });
}
