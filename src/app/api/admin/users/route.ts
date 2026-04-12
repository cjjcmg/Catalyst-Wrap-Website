import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name, role, disabled, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, name, email, role } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  if (role && !["admin", "user"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updates: Record<string, string> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "update_user",
    entity_type: "user",
    entity_id: id,
    changes: updates,
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id, disabled } = await request.json();

  if (!id || typeof disabled !== "boolean") {
    return NextResponse.json({ error: "User ID and disabled status required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ disabled })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: disabled ? "disable_user" : "enable_user",
    entity_type: "user",
    entity_id: id,
    changes: { disabled },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "delete_user",
    entity_type: "user",
    entity_id: id,
  });

  return NextResponse.json({ success: true });
}
