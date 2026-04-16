import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";
import { pushContactToMailchimp } from "@/lib/mailchimp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    const email = body.email.trim();
    const phone = body.phone.trim();
    const service = body.service || "Not specified";
    const vehicle = body.vehicle?.trim() || "Not specified";
    const message = body.message?.trim() || "No message";
    const textUpdates = body.textUpdates ? "Yes" : "No";

    // Save to Supabase
    const { data: insertedQuote, error: dbError } = await supabase.from("quotes").insert({
      name,
      email,
      phone,
      service,
      vehicle,
      message,
      text_updates: body.textUpdates ?? false,
      label: "lead",
      contact_tag: "A",
    }).select("id").single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // Split name and sync to Mailchimp
    const nameParts = name.split(" ");
    const firstName = nameParts[0] || name;
    const lastName = nameParts.slice(1).join(" ") || null;

    // Update first/last name in DB
    if (insertedQuote) {
      await supabase.from("quotes").update({ first_name: firstName, last_name: lastName }).eq("id", insertedQuote.id);
    }

    // Sync to Mailchimp in background
    pushContactToMailchimp({
      email, first_name: firstName, last_name: lastName, phone, service, vehicle,
      label: "lead", source: "website", subscribed: true, contact_tag: "A",
    }).catch((err: unknown) => console.error("Mailchimp sync error:", err));

    const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://catalystmotorsport.com";
    const manageUrl = insertedQuote ? `${domain}/admin/contact/${insertedQuote.id}` : `${domain}/admin`;

    // Get notification email from settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "notification_email")
      .single();
    const notificationEmail = settingsData?.value || "chris@catalystmotorsport.com";

    // Send email notification
    await sendEmail({
      to: notificationEmail,
      replyTo: email,
      subject: `New Quote Request — ${name} — ${service}`,
      html: `
        <h2>New Quote Request</h2>
        <table style="border-collapse:collapse;font-family:sans-serif;">
          <tr><td style="padding:6px 12px;font-weight:bold;">Name</td><td style="padding:6px 12px;">${name}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;"><a href="tel:${phone}">${phone}</a></td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Service</td><td style="padding:6px 12px;">${service}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Vehicle</td><td style="padding:6px 12px;">${vehicle}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Message</td><td style="padding:6px 12px;">${message}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:bold;">Text Updates</td><td style="padding:6px 12px;">${textUpdates}</td></tr>
        </table>
        <p style="margin-top:20px;">
          <a href="${manageUrl}" style="display:inline-block;padding:10px 24px;background:#dc2626;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;">Manage this contact</a>
        </p>
      `,
    });

    return NextResponse.json(
      { success: true, message: "Quote request received." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quote submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
