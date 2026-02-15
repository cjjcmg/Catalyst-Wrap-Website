import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface QuoteSubmission {
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  message: string;
  textUpdates: boolean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic server-side validation
    if (!body.name?.trim() || !body.email?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and phone are required." },
        { status: 400 }
      );
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const submission: QuoteSubmission = {
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      service: body.service || "Not specified",
      vehicle: body.vehicle?.trim() || "Not specified",
      message: body.message?.trim() || "No message",
      textUpdates: !!body.textUpdates,
    };

    await resend.emails.send({
      from: "Catalyst Motorsport <onboarding@resend.dev>",
      to: "chris@catalystmotorsport.com",
      subject: `New Quote Request from ${submission.name}`,
      html: `
        <h2>New Quote Request</h2>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
          <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${submission.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${submission.email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${submission.phone}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Service:</td><td style="padding: 8px;">${submission.service}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Vehicle:</td><td style="padding: 8px;">${submission.vehicle}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Message:</td><td style="padding: 8px;">${submission.message}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Text Updates:</td><td style="padding: 8px;">${submission.textUpdates ? "Yes" : "No"}</td></tr>
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
