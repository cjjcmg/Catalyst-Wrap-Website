import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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
    const { error: dbError } = await supabase.from("quotes").insert({
      name,
      email,
      phone,
      service,
      vehicle,
      message,
      text_updates: body.textUpdates ?? false,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
    }

    // Get notification email from settings
    const { data: settingsData } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "notification_email")
      .single();
    const notificationEmail = settingsData?.value || "chris@catalystmotorsport.com";

    // Send email notification
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
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
