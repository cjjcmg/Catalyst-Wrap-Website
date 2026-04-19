import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { quoteSentEmail } from "@/lib/email/invoicing-templates";
import { sendSms, isSmsConfigured } from "@/lib/twilio";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const FROM_EMAIL =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";

/**
 * Send or resend a quote email.
 *
 * Expects multipart/form-data so the caller (admin UI) can upload the PDF
 * bytes it rendered client-side via pdf().toBlob() — this matches the
 * PDF the user previews in the browser and sidesteps react-pdf's Node SSR
 * issues. Fields:
 *   - pdf (File): the rendered PDF
 *   - note (string, optional): personal note to include in the email body
 *   - resend_only (string "1"|"0"): do not flip status to 'sent'
 */
export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data. Make sure the client uploads the rendered PDF." },
      { status: 400 }
    );
  }

  const pdfFile = formData.get("pdf");
  if (!pdfFile || typeof pdfFile === "string") {
    return NextResponse.json({ error: "Missing PDF file upload" }, { status: 400 });
  }
  const personalNote = (formData.get("note") as string | null) || undefined;
  const resend_only = formData.get("resend_only") === "1";

  // Load quote + contact for email composition.
  const { data: quote, error: qErr } = await supabase
    .from("sales_quotes")
    .select(`
      id, quote_number, status, contact_id, total, deposit_amount_calc,
      expires_at, public_token,
      quotes:contact_id ( id, name, email, phone )
    `)
    .eq("id", qid)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  if (!["draft", "sent", "viewed"].includes(quote.status)) {
    return NextResponse.json({ error: `Cannot send a quote in status '${quote.status}'` }, { status: 409 });
  }

  const contact = quote.quotes as unknown as { id: number; name: string; email: string; phone: string | null };
  if (!contact?.email) {
    return NextResponse.json({ error: "Contact has no email on file" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("invoicing_settings")
    .select("business_name, business_address, business_phone, business_website, logo_url")
    .eq("id", 1)
    .single();

  if (!settings) {
    return NextResponse.json({ error: "Invoicing settings missing" }, { status: 500 });
  }

  const pdfBuffer = Buffer.from(await (pdfFile as File).arrayBuffer());

  const origin = request.headers.get("origin") || new URL(request.url).origin;
  const acceptanceUrl = `${origin}/quotes/${quote.public_token}`;

  const { subject, html, text } = quoteSentEmail({
    customerName: contact.name,
    quoteNumber: quote.quote_number,
    totalAmount: Number(quote.total),
    depositAmount: quote.deposit_amount_calc == null ? null : Number(quote.deposit_amount_calc),
    expiresAt: quote.expires_at,
    acceptanceUrl,
    personalNote: personalNote && personalNote.trim() ? personalNote.trim() : undefined,
    settings,
  });

  const { error: sendErr } = await resend.emails.send({
    from: FROM_EMAIL,
    to: contact.email,
    subject,
    html,
    text,
    replyTo: "team@catalystmotorsport.com",
    attachments: [
      {
        filename: `${quote.quote_number}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (sendErr) {
    console.error("Resend error:", sendErr);
    return NextResponse.json({ error: sendErr.message || "Failed to send email" }, { status: 500 });
  }

  if (!resend_only && quote.status === "draft") {
    const { error: upErr } = await supabase
      .from("sales_quotes")
      .update({ status: "sent" })
      .eq("id", qid);
    if (upErr) console.warn("Failed to mark quote as sent:", upErr);
  }

  let smsSent = false;
  if (isSmsConfigured() && contact.phone) {
    const { data: contactRow } = await supabase
      .from("quotes")
      .select("text_updates")
      .eq("id", contact.id)
      .single();
    if (contactRow?.text_updates) {
      smsSent = await sendSms({
        to: contact.phone,
        body: `Your ${settings.business_name} quote is ready: ${acceptanceUrl}`,
      });
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: resend_only ? "resend_sales_quote" : "send_sales_quote",
    entity_type: "sales_quote",
    entity_id: qid,
    changes: { quote_number: quote.quote_number, to: contact.email, sms: smsSent },
  });

  return NextResponse.json({ success: true, sms_sent: smsSent });
}
