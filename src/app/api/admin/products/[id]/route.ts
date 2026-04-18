import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const productId = Number(id);
  if (!productId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data, error } = await supabase
    .from("products")
    .select("*, product_pricing(size_tier, default_price)")
    .eq("id", productId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const productId = Number(id);
  if (!productId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name.trim();
  if (typeof body.description === "string" || body.description === null) patch.description = body.description || null;
  if (typeof body.is_taxable === "boolean") patch.is_taxable = body.is_taxable;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;
  if (typeof body.category === "string") patch.category = body.category;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("products")
    .update(patch)
    .eq("id", productId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "update_product",
    entity_type: "product",
    entity_id: productId,
    changes: patch,
  });

  return NextResponse.json({ product: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const { id } = await params;
  const productId = Number(id);
  if (!productId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    return NextResponse.json({ error: "Failed to delete (may be referenced by existing quotes)" }, { status: 409 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "delete_product",
    entity_type: "product",
    entity_id: productId,
  });

  return NextResponse.json({ success: true });
}
