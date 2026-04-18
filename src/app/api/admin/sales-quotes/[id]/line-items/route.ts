import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid quote id" }, { status: 400 });

  const body = await request.json();
  const { product_id, description, quantity, unit_price, is_taxable, sort_order } = body as {
    product_id?: number | null;
    description: string;
    quantity: number;
    unit_price: number;
    is_taxable?: boolean;
    sort_order?: number;
  };

  if (!description || typeof description !== "string") {
    return NextResponse.json({ error: "description required" }, { status: 400 });
  }
  const q = Number(quantity);
  const up = Number(unit_price);
  if (Number.isNaN(q) || q <= 0) {
    return NextResponse.json({ error: "quantity must be > 0" }, { status: 400 });
  }
  if (Number.isNaN(up) || up < 0) {
    return NextResponse.json({ error: "unit_price must be >= 0" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("sales_quote_line_items")
    .insert({
      sales_quote_id: qid,
      product_id: product_id ?? null,
      description: description.trim(),
      quantity: q,
      unit_price: up,
      line_total: +(q * up).toFixed(2),
      is_taxable: is_taxable ?? true,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Failed to add line item" }, { status: 500 });
  }

  return NextResponse.json({ line_item: data });
}
