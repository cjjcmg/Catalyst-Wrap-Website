import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "overdue"; // overdue | today | upcoming | completed
  const quoteId = searchParams.get("quote_id");
  const agentId = searchParams.get("agent_id");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  let query = supabase
    .from("crm_reminders")
    .select("*, quotes(name, contact_tag, email, phone), users(name)")
    .order("reminder_date", { ascending: true });

  if (quoteId) query = query.eq("quote_id", Number(quoteId));
  if (agentId) query = query.eq("agent_id", Number(agentId));

  switch (filter) {
    case "overdue":
      query = query.eq("is_completed", false).lt("reminder_date", todayStart);
      break;
    case "today":
      query = query.eq("is_completed", false).gte("reminder_date", todayStart).lt("reminder_date", todayEnd);
      break;
    case "upcoming":
      query = query.eq("is_completed", false).gte("reminder_date", todayEnd);
      break;
    case "completed":
      query = query.eq("is_completed", true).order("reminder_date", { ascending: false });
      break;
    case "all":
      query = query.eq("is_completed", false);
      break;
  }

  const { data, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }

  return NextResponse.json({ reminders: data });
}

export async function POST(request: Request) {
  const user = await getUser();
  const { quote_id, reminder_date, reminder_type, message } = await request.json();

  if (!quote_id || !reminder_date) {
    return NextResponse.json({ error: "quote_id and reminder_date are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_reminders")
    .insert({
      quote_id,
      agent_id: user?.id || null,
      reminder_date,
      reminder_type: reminder_type || "follow_up",
      message: message?.trim() || null,
      is_completed: false,
      is_auto_generated: false,
    })
    .select("*, quotes(name, contact_tag), users(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create reminder" }, { status: 500 });
  }

  return NextResponse.json({ reminder: data });
}

export async function PATCH(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_reminders")
    .update({ is_completed: true })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to complete reminder" }, { status: 500 });
  }

  return NextResponse.json({ reminder: data });
}
