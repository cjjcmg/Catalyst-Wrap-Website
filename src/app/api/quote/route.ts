import { NextResponse } from "next/server";

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

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error("N8N_WEBHOOK_URL is not configured");
      return NextResponse.json(
        { error: "Internal server error. Please try again." },
        { status: 500 }
      );
    }

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: body.name.trim(),
        email: body.email.trim(),
        phone: body.phone.trim(),
        service: body.service || "Not specified",
        vehicle: body.vehicle?.trim() || "Not specified",
        message: body.message?.trim() || "No message",
        textUpdates: !!body.textUpdates,
      }),
    });

    if (!n8nResponse.ok) {
      console.error("n8n webhook failed:", n8nResponse.status);
      return NextResponse.json(
        { error: "Internal server error. Please try again." },
        { status: 500 }
      );
    }

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
