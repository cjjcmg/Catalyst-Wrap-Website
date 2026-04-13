import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET || "";

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const domain = process.env.NEXT_PUBLIC_SITE_URL || "https://catalystmotorsport.com";

  // Get today's date range in Pacific Time
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });
  const [month, day, year] = todayStr.split("/");
  const todayStart = `${year}-${month}-${day}T00:00:00-07:00`;
  const todayEnd = `${year}-${month}-${day}T23:59:59-07:00`;

  // 1. New contacts (status = 'new')
  const { data: newContacts } = await supabase
    .from("quotes")
    .select("id, name, email, phone, service, created_at, assigned_agent_id, users(name)")
    .eq("contact_status", "new")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(25);

  // 2. Quoted contacts (status = 'quoted')
  const { data: quotedContacts } = await supabase
    .from("quotes")
    .select("id, name, email, phone, service, estimated_value, assigned_agent_id, users(name)")
    .eq("contact_status", "quoted")
    .eq("archived", false)
    .order("created_at", { ascending: false })
    .limit(25);

  // 3. Today's schedule
  const { data: todayAppts } = await supabase
    .from("appointments")
    .select("id, title, date_time, end_time, details, status, quote_id, quotes(name)")
    .gte("date_time", todayStart)
    .lte("date_time", todayEnd)
    .eq("status", "scheduled")
    .order("date_time", { ascending: true });

  const formattedDate = now.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Build HTML
  let html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#111;padding:24px;border-radius:12px;">
        <h1 style="color:#fff;font-size:24px;margin:0 0 4px;">Catalyst Motorsport</h1>
        <p style="color:#888;font-size:14px;margin:0;">Daily Digest — ${formattedDate}</p>
      </div>
  `;

  // New Contacts
  html += `
    <div style="margin-top:24px;">
      <h2 style="color:#333;font-size:18px;border-bottom:2px solid #dc2626;padding-bottom:6px;">
        New Contacts (${(newContacts || []).length})
      </h2>
  `;

  if (!newContacts || newContacts.length === 0) {
    html += `<p style="color:#888;font-size:14px;">No new contacts.</p>`;
  } else {
    html += `<table style="width:100%;border-collapse:collapse;font-size:14px;">`;
    for (const c of newContacts) {
      const agent = (c as Record<string, unknown>).users ? ((c as Record<string, unknown>).users as { name: string })?.name || "Unassigned" : "Unassigned";
      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px 4px;">
            <a href="${domain}/admin/crm/contacts/${c.id}" style="color:#dc2626;text-decoration:none;font-weight:600;">${c.name}</a>
          </td>
          <td style="padding:8px 4px;color:#666;">${c.service || "—"}</td>
          <td style="padding:8px 4px;color:#666;">${c.phone || ""}</td>
          <td style="padding:8px 4px;color:#888;font-size:12px;">${agent}</td>
        </tr>
      `;
    }
    html += `</table>`;
  }
  html += `</div>`;

  // Quoted Contacts
  html += `
    <div style="margin-top:24px;">
      <h2 style="color:#333;font-size:18px;border-bottom:2px solid #8b5cf6;padding-bottom:6px;">
        Quoted Contacts (${(quotedContacts || []).length})
      </h2>
  `;

  if (!quotedContacts || quotedContacts.length === 0) {
    html += `<p style="color:#888;font-size:14px;">No quoted contacts.</p>`;
  } else {
    html += `<table style="width:100%;border-collapse:collapse;font-size:14px;">`;
    for (const c of quotedContacts) {
      const agent = (c as Record<string, unknown>).users ? ((c as Record<string, unknown>).users as { name: string })?.name || "Unassigned" : "Unassigned";
      html += `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px 4px;">
            <a href="${domain}/admin/crm/contacts/${c.id}" style="color:#dc2626;text-decoration:none;font-weight:600;">${c.name}</a>
          </td>
          <td style="padding:8px 4px;color:#666;">${c.service || "—"}</td>
          <td style="padding:8px 4px;color:#666;">${c.estimated_value ? "$" + Number(c.estimated_value).toLocaleString() : ""}</td>
          <td style="padding:8px 4px;color:#888;font-size:12px;">${agent}</td>
        </tr>
      `;
    }
    html += `</table>`;
  }
  html += `</div>`;

  // Today's Schedule
  html += `
    <div style="margin-top:24px;">
      <h2 style="color:#333;font-size:18px;border-bottom:2px solid #f59e0b;padding-bottom:6px;">
        Today's Schedule (${(todayAppts || []).length})
      </h2>
  `;

  if (!todayAppts || todayAppts.length === 0) {
    html += `<p style="color:#888;font-size:14px;">No appointments scheduled for today.</p>`;
  } else {
    for (const a of todayAppts) {
      const time = new Date(a.date_time).toLocaleTimeString("en-US", {
        timeZone: "America/Los_Angeles",
        hour: "numeric",
        minute: "2-digit",
      });
      const endTime = a.end_time
        ? " — " + new Date(a.end_time).toLocaleTimeString("en-US", { timeZone: "America/Los_Angeles", hour: "numeric", minute: "2-digit" })
        : "";
      const contactName = (a as Record<string, unknown>).quotes ? ((a as Record<string, unknown>).quotes as { name: string })?.name || "" : "";

      html += `
        <div style="padding:10px 0;border-bottom:1px solid #eee;">
          <p style="margin:0;font-size:14px;">
            <strong style="color:#333;">${time}${endTime}</strong>
            ${a.title ? ` — ${a.title}` : ""}
          </p>
          ${contactName ? `<p style="margin:2px 0 0;font-size:13px;color:#666;">
            <a href="${domain}/admin/crm/contacts/${a.quote_id}" style="color:#dc2626;text-decoration:none;">${contactName}</a>
          </p>` : ""}
          ${a.details ? `<p style="margin:2px 0 0;font-size:13px;color:#888;">${a.details}</p>` : ""}
        </div>
      `;
    }
  }
  html += `</div>`;

  // Footer
  html += `
    <div style="margin-top:32px;padding-top:16px;border-top:1px solid #eee;">
      <p style="font-size:12px;color:#888;">
        <a href="${domain}/admin/crm" style="color:#dc2626;text-decoration:none;">Open CRM Dashboard</a> &middot;
        <a href="${domain}/admin/crm/contacts" style="color:#dc2626;text-decoration:none;">View All Contacts</a> &middot;
        <a href="${domain}/admin/schedule" style="color:#dc2626;text-decoration:none;">Schedule Appointment</a>
      </p>
      <p style="font-size:11px;color:#aaa;">Catalyst Motorsport — 1161 N Cosby Way, Unit T, Anaheim, CA</p>
    </div>
    </div>
  `;

  // Send email
  try {
    await sendEmail({
      to: "team@catalystmotorsport.com",
      subject: `Daily Digest — ${formattedDate} — Catalyst Motorsport`,
      html,
    });

    return NextResponse.json({
      success: true,
      newContacts: (newContacts || []).length,
      quotedContacts: (quotedContacts || []).length,
      todayAppts: (todayAppts || []).length,
    });
  } catch (err) {
    console.error("Daily digest email error:", err);
    return NextResponse.json({ error: "Failed to send digest" }, { status: 500 });
  }
}
