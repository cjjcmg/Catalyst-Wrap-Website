import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const quoteId = searchParams.get("quote_id");

  if (!quoteId) {
    return NextResponse.json({ error: "quote_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_activities")
    .select("*, users(name)")
    .eq("quote_id", Number(quoteId))
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }

  return NextResponse.json({ activities: data });
}

export async function POST(request: Request) {
  const user = await getUser();
  const { quote_id, activity_type, subject, body } = await request.json();

  if (!quote_id || !activity_type) {
    return NextResponse.json({ error: "quote_id and activity_type are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("crm_activities")
    .insert({
      quote_id,
      agent_id: user?.id || null,
      activity_type,
      subject: subject?.trim() || null,
      body: body?.trim() || null,
    })
    .select("*, users(name)")
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }

  // Update last_contact_date on the quote
  await supabase
    .from("quotes")
    .update({ last_contact_date: new Date().toISOString() })
    .eq("id", quote_id);

  return NextResponse.json({ activity: data });
}
