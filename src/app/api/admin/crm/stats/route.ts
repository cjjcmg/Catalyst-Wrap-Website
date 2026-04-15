import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  const [quotesRes, activitiesRes, remindersRes] = await Promise.all([
    supabase.from("quotes").select("id, contact_tag, contact_status, created_at, archived").eq("archived", false),
    supabase.from("crm_activities").select("id, activity_type, subject, created_at, quotes(name)").order("created_at", { ascending: false }).limit(10),
    supabase.from("crm_reminders").select("id, message, reminder_date, is_completed, quote_id, quotes(name, contact_tag)").eq("is_completed", false).lt("reminder_date", now.toISOString()).order("reminder_date", { ascending: true }).limit(10),
  ]);

  const quotes = quotesRes.data || [];
  const activities = activitiesRes.data || [];
  const overdueReminders = remindersRes.data || [];

  // Pipeline counts
  const statuses = ["new", "contacted", "quoted", "scheduled", "in_progress", "completed", "client", "past_client", "lost"];
  const pipeline: Record<string, number> = {};
  statuses.forEach((s) => { pipeline[s] = 0; });
  quotes.forEach((q) => { if (q.contact_status) pipeline[q.contact_status] = (pipeline[q.contact_status] || 0) + 1; });

  // Tag counts
  const tags: Record<string, number> = { A: 0, B: 0, C: 0, "!": 0, untagged: 0 };
  quotes.forEach((q) => {
    if (q.contact_tag && tags[q.contact_tag] !== undefined) tags[q.contact_tag]++;
    else tags.untagged++;
  });

  // Leads today
  const leadsToday = quotes.filter((q) => q.created_at >= todayStart && q.created_at < todayEnd).length;

  return NextResponse.json({
    totalContacts: quotes.length,
    leadsToday,
    pipeline,
    tags,
    recentActivities: activities,
    overdueReminders,
  });
}
