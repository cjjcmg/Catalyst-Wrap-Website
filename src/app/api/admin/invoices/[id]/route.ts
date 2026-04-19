import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase
      .from("invoices")
      .select(`
        *,
        sales_quotes:sales_quote_id ( id, quote_number, total, status, assigned_agent_id ),
        quotes:contact_id ( id, name, email, phone )
      `)
      .eq("id", iid)
      .single(),
    supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", iid)
      .order("paid_at", { ascending: false }),
  ]);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice, payments: payments || [] });
}

/**
 * Admin-only local-state deletion. Wipes the invoice + its payment rows
 * and un-converts the parent quote (back to 'accepted') if this was the
 * only invoice tied to it.
 *
 * This deliberately does NOT touch Square. Intended for cleaning up test
 * invoices, mis-created records, or anything else the shop never wants in
 * its local history. If the invoice exists on Square's side, handle it
 * there separately (void in sandbox, refund / void in production).
 */
export async function DELETE(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, sales_quote_id, status, square_invoice_id")
    .eq("id", iid)
    .single();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  // Delete payments first (no ON DELETE CASCADE on payments.invoice_id).
  const { error: pErr } = await supabase.from("payments").delete().eq("invoice_id", iid);
  if (pErr) {
    return NextResponse.json({ error: "Failed to delete payment rows: " + pErr.message }, { status: 500 });
  }

  // Delete the invoice.
  const { error: iErr } = await supabase.from("invoices").delete().eq("id", iid);
  if (iErr) {
    return NextResponse.json({ error: "Failed to delete invoice: " + iErr.message }, { status: 500 });
  }

  // Un-convert the parent quote if this was its only invoice.
  const { count: remaining } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("sales_quote_id", invoice.sales_quote_id);
  if ((remaining ?? 0) === 0) {
    const { data: quote } = await supabase
      .from("sales_quotes")
      .select("status")
      .eq("id", invoice.sales_quote_id)
      .single();
    if (quote?.status === "converted") {
      await supabase
        .from("sales_quotes")
        .update({ status: "accepted" })
        .eq("id", invoice.sales_quote_id);
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "delete_invoice_local",
    entity_type: "invoice",
    entity_id: iid,
    changes: {
      invoice_number: invoice.invoice_number,
      prior_status: invoice.status,
      square_invoice_id: invoice.square_invoice_id,
    },
  });

  return NextResponse.json({ success: true });
}
