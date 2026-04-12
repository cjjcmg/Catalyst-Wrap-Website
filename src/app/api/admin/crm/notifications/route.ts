import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("crm_notifications")
    .select("*")
    .eq("agent_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  const unreadCount = (data || []).filter((n) => !n.is_read).length;

  return NextResponse.json({ notifications: data, unread_count: unreadCount });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id, mark_all_read } = await request.json();

  if (mark_all_read) {
    await supabase
      .from("crm_notifications")
      .update({ is_read: true })
      .eq("agent_id", user.id)
      .eq("is_read", false);

    return NextResponse.json({ success: true });
  }

  if (!id) {
    return NextResponse.json({ error: "id or mark_all_read is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("crm_notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("agent_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to mark notification read" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
