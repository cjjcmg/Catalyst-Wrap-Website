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
  const id = searchParams.get("id");

  if (id) {
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", Number(id))
      .single();

    if (error) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }
    return NextResponse.json({ quote: data });
  }

  const archived = searchParams.get("archived") === "true";

  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .eq("archived", archived)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }

  return NextResponse.json({ quotes: data });
}

export async function PUT(request: Request) {
  const user = await getUser();
  const { id, ...fields } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: "update_quote",
      entity_type: "quote",
      entity_id: id,
      changes: fields,
    });
  }

  return NextResponse.json({ quote: data });
}

export async function PATCH(request: Request) {
  const user = await getUser();
  const { id, archived } = await request.json();

  if (!id || typeof archived !== "boolean") {
    return NextResponse.json({ error: "id and archived (boolean) are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .update({ archived })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to update quote" }, { status: 500 });
  }

  if (user) {
    await logAudit({
      user_id: user.id,
      user_email: user.email,
      action: archived ? "archive_quote" : "unarchive_quote",
      entity_type: "quote",
      entity_id: id,
      changes: { archived },
    });
  }

  return NextResponse.json({ quote: data });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();

  if (!id) {
    return NextResponse.json({ error: "Quote ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("quotes").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Failed to delete quote" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
