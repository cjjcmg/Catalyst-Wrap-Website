import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "notification_email")
    .single();

  if (error) {
    return NextResponse.json({ email: "chris@catalystmotorsport.com" });
  }

  return NextResponse.json({ email: data.value });
}

export async function PUT(request: Request) {
  const user = await getUser();
  const { email } = await request.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { error } = await supabase
    .from("settings")
    .upsert(
      { key: "notification_email", value: email, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "update_settings",
      entity_type: "settings",
      changes: { notification_email: email },
    });
  }

  return NextResponse.json({ success: true });
}
