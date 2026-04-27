import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * Reverse an accepted quote back to 'draft', wiping acceptance metadata so
 * the quote can be re-edited, re-sent, or re-signed. Intended for scope
 * changes or mis-clicks — not for staff-driven "never mind" flows after
 * real work has already been invoiced. Refuses if any invoice already
 * references the quote; in that case the correct path is voiding the
 * invoice on Square first (Phase 4).
 */
export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const reason: string | null = typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

  const { data: quote, error: qErr } = await supabase
    .from("sales_quotes")
    .select("id, quote_number, status, contact_id, assigned_agent_id")
    .eq("id", qid)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.status !== "accepted") {
    return NextResponse.json({ error: `Only accepted quotes can be cancelled (status: '${quote.status}')` }, { status: 409 });
  }

  // Block if any invoice references this quote — those need to be voided first.
  const { count: invoiceCount } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("sales_quote_id", qid);
  if ((invoiceCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Cannot cancel: this quote has one or more invoices. Void the invoices on Square first." },
      { status: 409 }
    );
  }

  // Flip status + clear acceptance metadata in one UPDATE. The Phase 1b
  // trigger runs on status change but has no 'draft' branch, so nothing
  // gets re-logged automatically — we write the explicit activity below.
  const { error: upErr } = await supabase
    .from("sales_quotes")
    .update({
      status: "draft",
      accepted_at: null,
      accepted_by_name: null,
      accepted_signature_checkbox: null,
      accepted_ip: null,
      accepted_user_agent: null,
    })
    .eq("id", qid);

  if (upErr) {
    return NextResponse.json({ error: "Failed to cancel acceptance: " + upErr.message }, { status: 500 });
  }

  // Clean up the auto-generated "Send Square invoice" reminder the original
  // acceptance trigger created, so it doesn't pop up overdue.
  await supabase
    .from("crm_reminders")
    .delete()
    .eq("quote_id", quote.contact_id)
    .eq("is_auto_generated", true)
    .ilike("message", `Send Square invoice for ${quote.quote_number}%`);

  // Log the cancellation explicitly
  await supabase.from("crm_activities").insert({
    quote_id: quote.contact_id,
    agent_id: quote.assigned_agent_id,
    activity_type: "status_change",
    subject: `Quote ${quote.quote_number} acceptance cancelled by ${user.name || user.email}`,
    body: reason,
    metadata: {
      sales_quote_id: qid,
      quote_number: quote.quote_number,
      event: "acceptance_cancelled",
      cancelled_by_user_id: user.id,
      reason,
    },
  });

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "cancel_sales_quote_acceptance",
    entity_type: "sales_quote",
    entity_id: qid,
    changes: { quote_number: quote.quote_number, reason },
  });

  return NextResponse.json({ success: true });
}
