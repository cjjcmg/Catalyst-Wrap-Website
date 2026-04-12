import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";
import { logAudit } from "@/lib/audit";

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
    .from("notes")
    .select("*")
    .eq("quote_id", Number(quoteId))
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}

export async function POST(request: Request) {
  const user = await getUser();
  const { quote_id, content } = await request.json();

  if (!quote_id || !content?.trim()) {
    return NextResponse.json({ error: "quote_id and content are required" }, { status: 400 });
  }

  const insertData: Record<string, unknown> = {
    quote_id,
    content: content.trim(),
  };

  if (user) {
    insertData.created_by = user.email;
    insertData.created_by_name = user.name;
  }

  const { data, error } = await supabase
    .from("notes")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "create_note",
      entity_type: "note",
      entity_id: data.id,
      changes: { quote_id, content: content.trim() },
    });
  }

  return NextResponse.json({ note: data });
}

export async function DELETE(request: Request) {
  const user = await getUser();
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "delete_note",
      entity_type: "note",
      entity_id: id,
    });
  }

  return NextResponse.json({ success: true });
}
