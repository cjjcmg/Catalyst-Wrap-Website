import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { isSquareConfigured, refundSquarePayment } from "@/lib/square";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  if (!isSquareConfigured()) {
    return NextResponse.json({ error: "Square is not configured" }, { status: 503 });
  }

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const amountRaw = body.amount;
  const reason: string | undefined = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : undefined;

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, amount")
    .eq("id", iid)
    .single();
  if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status !== "paid") {
    return NextResponse.json({ error: "Only paid invoices can be refunded" }, { status: 409 });
  }

  // Find the most recent positive payment on this invoice
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, square_payment_id, paid_at")
    .eq("invoice_id", iid)
    .gt("amount", 0)
    .order("paid_at", { ascending: false });

  const latest = payments?.[0];
  if (!latest || !latest.square_payment_id) {
    return NextResponse.json({ error: "No Square payment on file to refund" }, { status: 409 });
  }

  const refundAmount = amountRaw == null ? Number(latest.amount) : Number(amountRaw);
  if (Number.isNaN(refundAmount) || refundAmount <= 0) {
    return NextResponse.json({ error: "Refund amount must be > 0" }, { status: 400 });
  }
  if (refundAmount > Number(latest.amount)) {
    return NextResponse.json(
      { error: `Refund exceeds original payment of $${Number(latest.amount).toFixed(2)}` },
      { status: 400 }
    );
  }

  let refund;
  try {
    refund = await refundSquarePayment(latest.square_payment_id, Math.round(refundAmount * 100), reason);
  } catch (e) {
    console.error("refundSquarePayment failed:", e);
    const msg = e instanceof Error ? e.message : "Square refund failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Record a negative-amount payment row so rollups see the refund
  await supabase.from("payments").insert({
    invoice_id: iid,
    amount: -refundAmount,
    square_payment_id: `refund-${refund?.id || Date.now()}`,
    payment_method: "square_refund",
    paid_at: new Date().toISOString(),
    raw_webhook_payload: (refund as unknown as object) || null,
  });

  // Log CRM activity
  await supabase.from("crm_activities").insert({
    quote_id: (await supabase.from("invoices").select("contact_id").eq("id", iid).single()).data?.contact_id,
    agent_id: null,
    activity_type: "status_change",
    subject: `Refund issued on ${invoice.invoice_number}: $${refundAmount.toFixed(2)}`,
    body: reason || null,
    metadata: {
      invoice_id: iid,
      invoice_number: invoice.invoice_number,
      refund_amount: refundAmount,
      event: "refund_issued",
      refunded_by_user_id: user.id,
    },
  });

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "refund_invoice",
    entity_type: "invoice",
    entity_id: iid,
    changes: { invoice_number: invoice.invoice_number, amount: refundAmount, reason },
  });

  return NextResponse.json({ success: true, refund_amount: refundAmount });
}
