import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

export interface LocalInvoice {
  id: number;
  invoice_number: string;
  status: string;
  amount: number;
  square_invoice_id: string | null;
}

export interface SquareState {
  status: string | null;
  completedPaymentIds: string[];
  amount: number;
}

/**
 * Apply Square's authoritative state to the local invoice row. Extracted to
 * a lib module so both the /sync route (manual sync button) and the /void
 * route (auto-reconcile on state-mismatch) can share it. Route files in
 * Next.js App Router may only export HTTP method handlers, so this cannot
 * live in a route.ts.
 */
export async function reconcileInvoice(
  invoice: LocalInvoice,
  state: SquareState,
  user: { id: number; email: string }
): Promise<{
  synced: boolean;
  previous_status: string;
  new_status: string;
  payments_inserted: number;
}> {
  const sqStatus = (state.status || "").toUpperCase();
  let newStatus = invoice.status;
  let paymentsInserted = 0;

  if (sqStatus === "PAID" || sqStatus === "PAYMENT_PENDING") {
    newStatus = "paid";
    const paidAt = new Date().toISOString();

    for (const squarePaymentId of state.completedPaymentIds) {
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("square_payment_id", squarePaymentId)
        .maybeSingle();
      if (existing) continue;

      await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: Number(invoice.amount),
        square_payment_id: squarePaymentId,
        payment_method: "square",
        paid_at: paidAt,
        raw_webhook_payload: { reconciled: true, square_invoice_id: invoice.square_invoice_id, ts: paidAt },
      });
      paymentsInserted++;
    }

    if (invoice.status !== "paid") {
      await supabase
        .from("invoices")
        .update({ status: "paid", paid_at: paidAt })
        .eq("id", invoice.id);
    }
  } else if (sqStatus === "CANCELED" || sqStatus === "FAILED") {
    newStatus = "void";
    if (invoice.status !== "void") {
      await supabase.from("invoices").update({ status: "void" }).eq("id", invoice.id);
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "sync_invoice_from_square",
    entity_type: "invoice",
    entity_id: invoice.id,
    changes: {
      invoice_number: invoice.invoice_number,
      square_status: state.status,
      previous_local_status: invoice.status,
      new_local_status: newStatus,
      payments_inserted: paymentsInserted,
    },
  });

  return {
    synced: newStatus !== invoice.status || paymentsInserted > 0,
    previous_status: invoice.status,
    new_status: newStatus,
    payments_inserted: paymentsInserted,
  };
}
