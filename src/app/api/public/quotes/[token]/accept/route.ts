import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { quoteAcceptedInternalEmail } from "@/lib/email/invoicing-templates";

type Params = { params: Promise<{ token: string }> };

const FROM_EMAIL =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";

export async function POST(request: Request, { params }: Params) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const name: string = typeof body.name === "string" ? body.name.trim() : "";
  const accepted: boolean = !!body.accepted;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!accepted) return NextResponse.json({ error: "You must check the acceptance box" }, { status: 400 });

  // Fetch quote and validate
  const { data: quote, error } = await supabase
    .from("sales_quotes")
    .select(`
      id, quote_number, status, expires_at, total, deposit_amount_calc, contact_id,
      vehicle_year, vehicle_make, vehicle_model, vehicle_color,
      assigned_agent_id,
      quotes:contact_id ( name, email )
    `)
    .eq("public_token", token)
    .single();

  if (error || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  if (quote.status === "accepted") {
    return NextResponse.json({ error: "This quote has already been accepted" }, { status: 409 });
  }
  if (quote.status === "declined") {
    return NextResponse.json({ error: "This quote has been cancelled" }, { status: 409 });
  }
  if (quote.status === "draft") {
    return NextResponse.json({ error: "This quote is not available" }, { status: 403 });
  }
  if (quote.status === "expired" || (quote.expires_at && new Date(quote.expires_at).getTime() < Date.now())) {
    return NextResponse.json({ error: "This quote has expired" }, { status: 410 });
  }

  // Capture acceptance metadata from request
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0].trim() : null) || headers.get("x-real-ip") || null;
  const userAgent = headers.get("user-agent") || null;
  const acceptedAt = new Date().toISOString();

  // Update quote — trigger fires and handles CRM activity, team notification, reminder, contact status bump.
  const { error: upErr } = await supabase
    .from("sales_quotes")
    .update({
      status: "accepted",
      accepted_at: acceptedAt,
      accepted_by_name: name,
      accepted_signature_checkbox: true,
      accepted_ip: ip,
      accepted_user_agent: userAgent,
    })
    .eq("id", quote.id);

  if (upErr) {
    console.error("accept update failed:", upErr);
    return NextResponse.json({ error: "Failed to record acceptance" }, { status: 500 });
  }

  // Fire internal email notification (best-effort)
  try {
    const { data: settings } = await supabase
      .from("invoicing_settings")
      .select("business_name, business_address, business_phone, business_website, logo_url, notification_email")
      .eq("id", 1)
      .single();

    // Gather recipients: notification_email + assigned agent's email + all active admins (honoring notification_preferences)
    const recipients: string[] = [];
    if (settings?.notification_email) recipients.push(settings.notification_email);

    const { data: team } = await supabase
      .from("users")
      .select("id, email, role, disabled, notification_preferences")
      .or(`role.eq.admin,id.eq.${quote.assigned_agent_id ?? 0}`);

    for (const u of team || []) {
      if (u.disabled) continue;
      const prefs = (u.notification_preferences as Record<string, unknown>) || {};
      if (prefs.quote_accepted === false) continue;
      if (u.email && !recipients.includes(u.email)) recipients.push(u.email);
    }

    if (settings && recipients.length > 0) {
      const contact = quote.quotes as unknown as { name: string; email: string };
      const origin = request.headers.get("origin") || new URL(request.url).origin;
      const { subject, html, text } = quoteAcceptedInternalEmail({
        customerName: contact?.name || "Customer",
        quoteNumber: quote.quote_number,
        totalAmount: Number(quote.total),
        depositAmount: quote.deposit_amount_calc == null ? null : Number(quote.deposit_amount_calc),
        acceptedByName: name,
        acceptedAt,
        acceptedIp: ip,
        vehicle: [quote.vehicle_year, quote.vehicle_make, quote.vehicle_model].filter(Boolean).join(" ") || "—",
        quoteLink: `${origin}/admin/quotes-docs/${quote.id}`,
        settings,
      });
      await resend.emails.send({ from: FROM_EMAIL, to: recipients, subject, html, text });
    }
  } catch (e) {
    console.error("accept notification email failed:", e);
    // Don't fail the acceptance because of a notification glitch
  }

  return NextResponse.json({ success: true });
}
