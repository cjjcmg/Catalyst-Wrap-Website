import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const SIZE_TIERS = ["small", "mid", "suv", "truck", "exotic"] as const;
type SizeTier = (typeof SIZE_TIERS)[number];

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const productId = Number(id);
  if (!productId) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json();
  const pricing = body.pricing as Partial<Record<SizeTier, number | null>>;
  if (!pricing || typeof pricing !== "object") {
    return NextResponse.json({ error: "pricing object required" }, { status: 400 });
  }

  const { data: product } = await supabase.from("products").select("id").eq("id", productId).single();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const upserts: { product_id: number; size_tier: SizeTier; default_price: number }[] = [];
  const deletes: SizeTier[] = [];
  for (const tier of SIZE_TIERS) {
    const raw = pricing[tier];
    if (raw == null || raw === ("" as unknown as number)) {
      deletes.push(tier);
      continue;
    }
    const n = Number(raw);
    if (Number.isNaN(n) || n < 0) {
      return NextResponse.json({ error: `Invalid price for ${tier}` }, { status: 400 });
    }
    upserts.push({ product_id: productId, size_tier: tier, default_price: n });
  }

  if (upserts.length > 0) {
    const { error: upErr } = await supabase
      .from("product_pricing")
      .upsert(upserts, { onConflict: "product_id,size_tier" });
    if (upErr) {
      return NextResponse.json({ error: "Failed to save pricing" }, { status: 500 });
    }
  }

  if (deletes.length > 0) {
    await supabase
      .from("product_pricing")
      .delete()
      .eq("product_id", productId)
      .in("size_tier", deletes);
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "update_product_pricing",
    entity_type: "product",
    entity_id: productId,
    changes: pricing,
  });

  const { data } = await supabase
    .from("product_pricing")
    .select("size_tier, default_price")
    .eq("product_id", productId);

  return NextResponse.json({ pricing: data || [] });
}
