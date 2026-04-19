import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { resend } from "@/lib/email";
import { quoteExpiringDigestEmail } from "@/lib/email/invoicing-templates";

const FROM_EMAIL =
  process.env.RESEND_WELCOME_FROM_EMAIL ||
  process.env.RESEND_FROM_EMAIL ||
  "Catalyst Motorsport <team@catalystmotorsport.com>";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Light auth: require Vercel cron secret OR the X-Cron-Secret env var
  const secret = request.headers.get("x-cron-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = process.env.CRON_SECRET;
  if (expected && secret !== expected) {
    // Allow unauthenticated Vercel cron triggers identified by user-agent
    const ua = request.headers.get("user-agent") || "";
    if (!ua.includes("vercel-cron")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  // 1) Flip any sent/viewed quotes whose expires_at is in the past.
  const { data: toExpire } = await supabase
    .from("sales_quotes")
    .select("id, quote_number")
    .in("status", ["sent", "viewed"])
    .lt("expires_at", now.toISOString());

  let expiredCount = 0;
  if (toExpire && toExpire.length > 0) {
    const ids = toExpire.map((q) => q.id);
    const { error } = await supabase
      .from("sales_quotes")
      .update({ status: "expired" })
      .in("id", ids);
    if (error) {
      console.error("expire-quotes update failed:", error);
    } else {
      expiredCount = ids.length;
    }
  }

  // 2) Find quotes expiring in the next 3 days, send a digest.
  const in3days = new Date(now.getTime() + 3 * 86400000);
  const { data: expiringSoon } = await supabase
    .from("sales_quotes")
    .select(`
      id, quote_number, total, expires_at,
      quotes:contact_id ( name )
    `)
    .in("status", ["sent", "viewed"])
    .gte("expires_at", now.toISOString())
    .lt("expires_at", in3days.toISOString())
    .order("expires_at", { ascending: true });

  let digestSent = false;
  if (expiringSoon && expiringSoon.length > 0) {
    const { data: settings } = await supabase
      .from("invoicing_settings")
      .select("business_name, business_address, business_phone, business_website, logo_url, notification_email")
      .eq("id", 1)
      .single();

    if (settings?.notification_email) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
      const rows = expiringSoon.map((q) => ({
        quote_number: q.quote_number,
        customer_name: (q.quotes as unknown as { name?: string })?.name || "—",
        total: Number(q.total),
        expires_at: q.expires_at as string,
        link: `${origin}/admin/quotes-docs/${q.id}`,
      }));

      const { subject, html, text } = quoteExpiringDigestEmail({ quotes: rows, settings });
      const { error: sendErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: settings.notification_email,
        subject,
        html,
        text,
      });
      if (sendErr) console.error("expire-quotes digest send failed:", sendErr);
      else digestSent = true;
    }
  }

  return NextResponse.json({
    expired_count: expiredCount,
    expiring_soon: expiringSoon?.length ?? 0,
    digest_sent: digestSent,
  });
}
