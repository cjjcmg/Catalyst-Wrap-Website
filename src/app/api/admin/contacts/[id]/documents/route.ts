import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

/**
 * Returns every sales quote, invoice, and payment tied to a contact, so the
 * contact-detail page can link to those documents.
 */
export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cid = Number(id);
  if (!cid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [{ data: quotes }, { data: invoices }] = await Promise.all([
    supabase
      .from("sales_quotes")
      .select("id, quote_number, status, total, created_at, sent_at, accepted_at, expires_at")
      .eq("contact_id", cid)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("id, invoice_number, type, status, amount, paid_at, sent_to_square_at, sales_quote_id, square_public_url")
      .eq("contact_id", cid)
      .order("created_at", { ascending: false }),
  ]);

  // Balance due = (sum of accepted/converted quote totals) − (sum of paid invoice amounts).
  // Declined/expired/draft/sent quotes aren't committed spend, so they don't count.
  const committedTotal = (quotes || [])
    .filter((q) => q.status === "accepted" || q.status === "converted")
    .reduce((s, q) => s + Number(q.total || 0), 0);
  const paidTotal = (invoices || [])
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const balanceDue = +(committedTotal - paidTotal).toFixed(2);

  return NextResponse.json({
    quotes: quotes || [],
    invoices: invoices || [],
    summary: {
      committed_total: +committedTotal.toFixed(2),
      paid_total: +paidTotal.toFixed(2),
      balance_due: balanceDue,
    },
  });
}
