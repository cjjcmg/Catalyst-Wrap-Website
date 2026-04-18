import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, itemId } = await params;
  const qid = Number(id);
  const iid = Number(itemId);
  if (!qid || !iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (body.quantity !== undefined) {
    const q = Number(body.quantity);
    if (Number.isNaN(q) || q <= 0) return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 });
    patch.quantity = q;
  }
  if (body.unit_price !== undefined) {
    const up = Number(body.unit_price);
    if (Number.isNaN(up) || up < 0) return NextResponse.json({ error: "unit_price must be >= 0" }, { status: 400 });
    patch.unit_price = up;
  }
  if (typeof body.is_taxable === "boolean") patch.is_taxable = body.is_taxable;
  if (body.sort_order !== undefined) patch.sort_order = Number(body.sort_order);
  if (body.product_id !== undefined) patch.product_id = body.product_id === null ? null : Number(body.product_id);

  if (patch.quantity !== undefined || patch.unit_price !== undefined) {
    const { data: existing } = await supabase
      .from("sales_quote_line_items")
      .select("quantity, unit_price")
      .eq("id", iid)
      .single();
    const q = (patch.quantity as number | undefined) ?? existing?.quantity ?? 1;
    const up = (patch.unit_price as number | undefined) ?? existing?.unit_price ?? 0;
    patch.line_total = +(Number(q) * Number(up)).toFixed(2);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sales_quote_line_items")
    .update(patch)
    .eq("id", iid)
    .eq("sales_quote_id", qid)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to update line item" }, { status: 500 });
  }

  return NextResponse.json({ line_item: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, itemId } = await params;
  const qid = Number(id);
  const iid = Number(itemId);
  if (!qid || !iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { error } = await supabase
    .from("sales_quote_line_items")
    .delete()
    .eq("id", iid)
    .eq("sales_quote_id", qid);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
