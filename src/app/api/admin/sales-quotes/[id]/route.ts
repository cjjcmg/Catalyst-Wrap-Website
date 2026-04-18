import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

const EDITABLE_FIELDS = [
  "vehicle_year",
  "vehicle_make",
  "vehicle_model",
  "vehicle_color",
  "vehicle_size_tier",
  "tax_rate",
  "discount_amount",
  "discount_reason",
  "deposit_type",
  "deposit_value",
  "customer_notes",
  "internal_notes",
  "terms",
  "assigned_agent_id",
  "status",
] as const;

const ALLOWED_STATUS = ["draft", "sent", "viewed", "accepted", "declined", "expired", "converted"] as const;

export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data, error } = await supabase
    .from("sales_quotes")
    .select(`
      *,
      sales_quote_line_items ( id, product_id, description, quantity, unit_price, line_total, is_taxable, sort_order ),
      quotes:contact_id ( id, name, email, phone, contact_tag, contact_status, vehicle, vehicle_year, vehicle_make, vehicle_model, vehicle_color )
    `)
    .eq("id", qid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = Array.isArray(data.sales_quote_line_items) ? [...data.sales_quote_line_items] : [];
  items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  data.sales_quote_line_items = items;

  return NextResponse.json({ quote: data });
}

export async function PUT(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    patch[key] = body[key];
  }

  if (patch.status !== undefined) {
    if (!ALLOWED_STATUS.includes(patch.status as (typeof ALLOWED_STATUS)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
  }
  if (patch.tax_rate !== undefined) {
    const r = Number(patch.tax_rate);
    if (Number.isNaN(r) || r < 0 || r > 1) {
      return NextResponse.json({ error: "tax_rate must be 0–1" }, { status: 400 });
    }
    patch.tax_rate = r;
  }
  if (patch.discount_amount !== undefined) {
    const d = Number(patch.discount_amount);
    if (Number.isNaN(d) || d < 0) {
      return NextResponse.json({ error: "discount_amount must be >= 0" }, { status: 400 });
    }
    patch.discount_amount = d;
  }
  if (patch.deposit_value !== undefined && patch.deposit_value !== null) {
    const v = Number(patch.deposit_value);
    if (Number.isNaN(v) || v < 0) {
      return NextResponse.json({ error: "deposit_value must be >= 0" }, { status: 400 });
    }
    patch.deposit_value = v;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sales_quotes")
    .update(patch)
    .eq("id", qid)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to update" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "update_sales_quote",
    entity_type: "sales_quote",
    entity_id: qid,
    changes: patch,
  });

  return NextResponse.json({ quote: data });
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  // Refuse to delete quotes that have invoices
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("sales_quote_id", qid);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "Cannot delete a quote with invoices — void the invoices first" }, { status: 409 });
  }

  const { error } = await supabase.from("sales_quotes").delete().eq("id", qid);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "delete_sales_quote",
    entity_type: "sales_quote",
    entity_id: qid,
  });

  return NextResponse.json({ success: true });
}
