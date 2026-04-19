import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { buildQuotePDFData, renderQuotePDFBuffer } from "@/lib/pdf/render";
import { quoteSentEmail } from "@/lib/email/invoicing-templates";
import { sendSms, isSmsConfigured } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const FROM_EMAIL =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";

export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const personalNote: string | undefined = typeof body.note === "string" ? body.note : undefined;
  const resend_only: boolean = !!body.resend_only;

  // Fetch + validate status. Allow: draft (first send), sent/viewed (resend).
  const { data: current, error: curErr } = await supabase
    .from("sales_quotes")
    .select("status, contact_id, quote_number")
    .eq("id", qid)
    .single();
  if (curErr || !current) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  if (!["draft", "sent", "viewed"].includes(current.status)) {
    return NextResponse.json({ error: `Cannot send a quote in status '${current.status}'` }, { status: 409 });
  }

  // Build PDF data + attachment
  const pdfData = await buildQuotePDFData(qid);
  if (!pdfData) return NextResponse.json({ error: "Failed to load quote data" }, { status: 500 });
  if (!pdfData.contact.email) {
    return NextResponse.json({ error: "Contact has no email address on file" }, { status: 400 });
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderQuotePDFBuffer(pdfData);
  } catch (e) {
    console.error("renderQuotePDFBuffer failed:", e);
    return NextResponse.json({ error: "Failed to render PDF" }, { status: 500 });
  }

  // Compose email
  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const { data: full } = await supabase
    .from("sales_quotes")
    .select("public_token, total, deposit_amount_calc, expires_at")
    .eq("id", qid)
    .single();
  const acceptanceUrl = `${origin}/quotes/${full?.public_token}`;

  const { subject, html, text } = quoteSentEmail({
    customerName: pdfData.contact.name,
    quoteNumber: pdfData.quote.quote_number,
    totalAmount: pdfData.quote.total,
    depositAmount: pdfData.quote.deposit_amount_calc,
    expiresAt: full?.expires_at || null,
    acceptanceUrl,
    personalNote,
    settings: pdfData.settings,
  });

  const { error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: pdfData.contact.email,
    subject,
    html,
    text,
    replyTo: "team@catalystmotorsport.com",
    attachments: [
      {
        filename: `${pdfData.quote.quote_number}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (sendErr) {
    console.error("Resend error:", sendErr);
    return NextResponse.json({ error: sendErr.message || "Failed to send email" }, { status: 500 });
  }

  // Transition draft → sent (trigger auto-stamps sent_at + expires_at).
  // On resend we do not re-trigger the status change.
  if (!resend_only && current.status === "draft") {
    const { error: upErr } = await supabase
      .from("sales_quotes")
      .update({ status: "sent" })
      .eq("id", qid);
    if (upErr) console.warn("Failed to mark quote as sent:", upErr);
  }

  // Best-effort SMS if configured and contact opted in
  let smsSent = false;
  if (isSmsConfigured()) {
    const { data: contact } = await supabase
      .from("quotes")
      .select("phone, text_updates")
      .eq("id", current.contact_id)
      .single();
    if (contact?.phone && contact.text_updates) {
      smsSent = await sendSms({
        to: contact.phone,
        body: `Your ${pdfData.settings.business_name} quote is ready: ${acceptanceUrl}`,
      });
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: resend_only ? "resend_sales_quote" : "send_sales_quote",
    entity_type: "sales_quote",
    entity_id: qid,
    changes: { quote_number: current.quote_number, to: pdfData.contact.email, sms: smsSent },
  });

  return NextResponse.json({ success: true, sms_sent: smsSent });
}
