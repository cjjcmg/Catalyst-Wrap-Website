import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { isSquareConfigured, getSquareInvoiceState } from "@/lib/square";
import { reconcileInvoice } from "@/lib/invoicing/reconcile";

type Params = { params: Promise<{ id: string }> };

/**
 * Reconcile a local invoice with its authoritative Square state. Useful
 * when a payment webhook was missed (signature mismatch, offline, delayed)
 * and the local 'pending_payment' row is stale.
 */
export async function POST(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSquareConfigured()) {
    return NextResponse.json({ error: "Square is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, amount, square_invoice_id")
    .eq("id", iid)
    .single();

  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (!invoice.square_invoice_id) {
    return NextResponse.json({ error: "No Square invoice id on record — nothing to sync" }, { status: 400 });
  }

  let state;
  try {
    state = await getSquareInvoiceState(invoice.square_invoice_id);
  } catch (e) {
    console.error("getSquareInvoiceState failed:", e);
    const msg = e instanceof Error ? e.message : "Square lookup failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
  if (!state) return NextResponse.json({ error: "Square returned no invoice data" }, { status: 502 });

  const result = await reconcileInvoice(invoice, state, user);
  return NextResponse.json(result);
}
