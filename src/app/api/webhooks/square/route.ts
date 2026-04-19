import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { verifySquareWebhook } from "@/lib/square";
import { resend } from "@/lib/email";
import { invoicePaidInternalEmail } from "@/lib/email/invoicing-templates";

const FROM_EMAIL =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";

/**
 * Square webhook receiver.
 *
 * We register for `invoice.payment_made` and `invoice.canceled` at the
 * Square dashboard (developer.squareup.com → app → Webhooks). Signature is
 * verified against SQUARE_WEBHOOK_SIGNATURE_KEY using Square's HMAC helper.
 * Payment events create a `payments` row (dedup'd by square_payment_id) and
 * flip the local invoice to 'paid' — the Phase 1b trigger then fans
 * notifications, updates contact status, and schedules the warranty
 * reminder. Cancellations flip the invoice to 'void'.
 */
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-square-hmacsha256-signature");

  // Compute the exact URL Square used to POST here — needed for signature
  // verification. Prefer the absolute URL from the forwarded-proto/host headers
  // since some edges strip scheme info from new URL(request.url).
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const pathWithQuery = new URL(request.url).pathname + new URL(request.url).search;
  const notificationUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}${pathWithQuery}`
    : request.url;

  const valid = await verifySquareWebhook({ body: rawBody, signature, notificationUrl });
  if (!valid) {
    console.warn("Square webhook: invalid signature", {
      hasSignature: !!signature,
      notificationUrl,
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.type;
  const obj = event.data?.object as { invoice?: Record<string, unknown>; payment?: Record<string, unknown> } | undefined;

  try {
    if (eventType === "invoice.payment_made") {
      await handleInvoicePaymentMade(obj, event);
    } else if (eventType === "invoice.canceled") {
      await handleInvoiceCanceled(obj);
    } else {
      // Log unknown types for visibility but don't fail — Square will retry otherwise.
      console.log("Square webhook: ignored type", eventType);
    }
  } catch (e) {
    console.error("Square webhook handler error:", e);
    // Return 200 so Square doesn't retry endlessly on a malformed-but-signed payload.
    return NextResponse.json({ received: true, warning: "handler threw — check logs" });
  }

  return NextResponse.json({ received: true });
}

async function handleInvoicePaymentMade(
  obj: { invoice?: Record<string, unknown>; payment?: Record<string, unknown> } | undefined,
  rawEvent: unknown
) {
  const sqInvoice = obj?.invoice as { id?: string } | undefined;
  const sqInvoiceId = sqInvoice?.id;
  if (!sqInvoiceId) return;

  // Find local invoice by square_invoice_id
  const { data: localInvoice } = await supabase
    .from("invoices")
    .select("id, status, amount, sales_quote_id, contact_id")
    .eq("square_invoice_id", sqInvoiceId)
    .single();

  if (!localInvoice) {
    console.warn("Square webhook payment_made: no local invoice for", sqInvoiceId);
    return;
  }

  // Extract payment fields. Square sends the payment_request metadata; we
  // pull the most recent payment record from the invoice.payment_requests[].
  const reqs = (obj?.invoice?.payment_requests as Array<Record<string, unknown>> | undefined) || [];
  const latestCompleted = reqs.find((r) => (r.completed_payment_ids as string[] | undefined)?.length);
  const squarePaymentId = (latestCompleted?.completed_payment_ids as string[] | undefined)?.slice(-1)[0];
  const paidAt = (latestCompleted?.updated_at as string | undefined) || new Date().toISOString();

  if (squarePaymentId) {
    // Dedup: if this payment was already recorded, skip insertion
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("square_payment_id", squarePaymentId)
      .maybeSingle();
    if (!existing) {
      await supabase.from("payments").insert({
        invoice_id: localInvoice.id,
        amount: localInvoice.amount,
        square_payment_id: squarePaymentId,
        payment_method: "square",
        paid_at: paidAt,
        raw_webhook_payload: rawEvent as object,
      });
    }
  }

  // Flip invoice to paid (triggers Phase 1b CRM hooks)
  if (localInvoice.status !== "paid") {
    await supabase
      .from("invoices")
      .update({ status: "paid", paid_at: paidAt })
      .eq("id", localInvoice.id);

    // Internal "payment received" email — separate from the in-app
    // notifications the trigger already inserted. Best-effort only.
    try {
      const { data: full } = await supabase
        .from("invoices")
        .select(`
          invoice_number, type, amount,
          sales_quotes:sales_quote_id ( quote_number, assigned_agent_id ),
          quotes:contact_id ( name, email )
        `)
        .eq("id", localInvoice.id)
        .single();
      const { data: settings } = await supabase
        .from("invoicing_settings")
        .select("business_name, business_address, business_phone, business_website, logo_url, notification_email")
        .eq("id", 1)
        .single();

      if (full && settings) {
        const contact = full.quotes as unknown as { name: string; email: string } | null;
        const quoteRef = full.sales_quotes as unknown as { quote_number: string; assigned_agent_id: number | null } | null;

        const recipients: string[] = [];
        if (settings.notification_email) recipients.push(settings.notification_email);
        if (quoteRef?.assigned_agent_id) {
          const { data: agent } = await supabase
            .from("users")
            .select("email, disabled, notification_preferences")
            .eq("id", quoteRef.assigned_agent_id)
            .single();
          const prefs = (agent?.notification_preferences as Record<string, unknown>) || {};
          if (agent?.email && !agent.disabled && prefs.invoice_paid !== false && !recipients.includes(agent.email)) {
            recipients.push(agent.email);
          }
        }

        if (recipients.length > 0) {
          const origin = process.env.NEXT_PUBLIC_SITE_URL || "";
          const { subject, html, text } = invoicePaidInternalEmail({
            customerName: contact?.name || "Customer",
            invoiceNumber: full.invoice_number,
            quoteNumber: quoteRef?.quote_number || "—",
            amount: Number(full.amount),
            type: full.type,
            invoiceLink: `${origin}/admin/invoices/${localInvoice.id}`,
            settings,
          });
          await resend.emails.send({ from: FROM_EMAIL, to: recipients, subject, html, text });
        }
      }
    } catch (e) {
      console.error("invoicePaidInternalEmail send failed (non-fatal):", e);
    }
  }
}

async function handleInvoiceCanceled(obj: { invoice?: Record<string, unknown> } | undefined) {
  const sqInvoice = obj?.invoice as { id?: string } | undefined;
  const sqInvoiceId = sqInvoice?.id;
  if (!sqInvoiceId) return;

  await supabase
    .from("invoices")
    .update({ status: "void" })
    .eq("square_invoice_id", sqInvoiceId);
}
