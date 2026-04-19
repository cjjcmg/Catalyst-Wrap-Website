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
  // Acceptance metadata — writable by staff for in-person acceptance.
  // Public acceptance goes through a separate route that validates the token.
  "accepted_by_name",
  "accepted_at",
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

  // Optional bulk line-item replacement. If line_items is provided the API
  // wipes existing items and inserts the new set — used by the draft editor
  // so staff can add/remove/reorder lines in one request. Only allowed while
  // the quote is still in draft to avoid rewriting a sent/accepted record.
  const replaceItems = Array.isArray(body.line_items)
    ? (body.line_items as Array<{ product_id?: number | null; description: string; quantity: number; unit_price: number; is_taxable?: boolean; sort_order?: number }>)
    : null;

  if (replaceItems && replaceItems.length > 0) {
    for (const li of replaceItems) {
      if (!li.description || typeof li.description !== "string" || !li.description.trim()) {
        return NextResponse.json({ error: "Every line item needs a description" }, { status: 400 });
      }
      const q = Number(li.quantity);
      const up = Number(li.unit_price);
      if (Number.isNaN(q) || q <= 0) {
        return NextResponse.json({ error: "line_items[*].quantity must be > 0" }, { status: 400 });
      }
      if (Number.isNaN(up) || up < 0) {
        return NextResponse.json({ error: "line_items[*].unit_price must be >= 0" }, { status: 400 });
      }
    }
  }

  if (Object.keys(patch).length === 0 && !replaceItems) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (replaceItems) {
    // Gate on current status
    const { data: current } = await supabase
      .from("sales_quotes")
      .select("status")
      .eq("id", qid)
      .single();
    if (!current) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    if (current.status !== "draft") {
      return NextResponse.json(
        { error: `Line items can only be replaced on draft quotes (currently '${current.status}'). Duplicate this quote first.` },
        { status: 409 }
      );
    }
  }

  let updatedQuote: unknown = null;
  if (Object.keys(patch).length > 0) {
    const { data, error } = await supabase
      .from("sales_quotes")
      .update(patch)
      .eq("id", qid)
      .select()
      .single();
    if (error || !data) {
      return NextResponse.json({ error: error?.message || "Failed to update" }, { status: 500 });
    }
    updatedQuote = data;
  }

  if (replaceItems) {
    const { error: delErr } = await supabase
      .from("sales_quote_line_items")
      .delete()
      .eq("sales_quote_id", qid);
    if (delErr) {
      return NextResponse.json({ error: "Failed to clear existing line items: " + delErr.message }, { status: 500 });
    }

    if (replaceItems.length > 0) {
      const rows = replaceItems.map((li, idx) => {
        const quantity = Number(li.quantity);
        const unit_price = Number(li.unit_price);
        return {
          sales_quote_id: qid,
          product_id: li.product_id ?? null,
          description: li.description.trim(),
          quantity,
          unit_price,
          line_total: +(quantity * unit_price).toFixed(2),
          is_taxable: li.is_taxable ?? true,
          sort_order: li.sort_order ?? idx * 10,
        };
      });
      const { error: insErr } = await supabase.from("sales_quote_line_items").insert(rows);
      if (insErr) {
        return NextResponse.json({ error: "Failed to insert new line items: " + insErr.message }, { status: 500 });
      }
    }

    // Re-fetch the quote so totals recomputed by triggers are returned to the caller
    const { data: refetched } = await supabase
      .from("sales_quotes")
      .select("*, sales_quote_line_items(*)")
      .eq("id", qid)
      .single();
    updatedQuote = refetched;
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: replaceItems ? "update_sales_quote_full" : "update_sales_quote",
    entity_type: "sales_quote",
    entity_id: qid,
    changes: { ...patch, ...(replaceItems ? { line_item_count: replaceItems.length } : {}) },
  });

  return NextResponse.json({ quote: updatedQuote });
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
