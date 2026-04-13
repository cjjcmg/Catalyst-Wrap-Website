import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Mailchimp webhook validation (required for webhook setup)
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

// POST: Mailchimp webhook events
export async function POST(request: Request) {
  try {
    const body = await request.formData().catch(() => null);

    // Mailchimp sends webhooks as form data
    const type = body?.get("type") as string | null;
    const email = (body?.get("data[email]") as string | null)?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    if (type === "unsubscribe" || type === "cleaned") {
      await supabase
        .from("quotes")
        .update({ subscribed: false })
        .eq("email", email);

      console.log(`Mailchimp webhook: ${type} — ${email}`);
    }

    if (type === "subscribe") {
      await supabase
        .from("quotes")
        .update({ subscribed: true })
        .eq("email", email);

      console.log(`Mailchimp webhook: subscribe — ${email}`);
    }

    if (type === "profile") {
      // Profile update — could sync fields back but keeping it simple
      console.log(`Mailchimp webhook: profile update — ${email}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Mailchimp webhook error:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
