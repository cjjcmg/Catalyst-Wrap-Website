import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const CATEGORIES = ["wrap", "ppf", "ceramic", "detail"] as const;
const SIZE_TIERS = ["small", "mid", "suv", "truck", "exotic"] as const;
type Category = (typeof CATEGORIES)[number];
type SizeTier = (typeof SIZE_TIERS)[number];

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("include_inactive") === "1";
  const category = searchParams.get("category");

  let query = supabase
    .from("products")
    .select("*, product_pricing(size_tier, default_price)")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);
  if (category && CATEGORIES.includes(category as Category)) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
  return NextResponse.json({ products: data });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { category, name, description, is_taxable, sort_order, pricing } = body as {
    category: Category;
    name: string;
    description?: string | null;
    is_taxable?: boolean;
    sort_order?: number;
    pricing?: Partial<Record<SizeTier, number>>;
  };

  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: product, error: insertErr } = await supabase
    .from("products")
    .insert({
      category,
      name: name.trim(),
      description: description?.trim() || null,
      is_taxable: is_taxable ?? true,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (insertErr || !product) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }

  if (pricing) {
    const rows = SIZE_TIERS
      .filter((t) => pricing[t] != null && !Number.isNaN(Number(pricing[t])))
      .map((t) => ({
        product_id: product.id,
        size_tier: t,
        default_price: Number(pricing[t]),
      }));
    if (rows.length > 0) {
      await supabase.from("product_pricing").insert(rows);
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "create_product",
    entity_type: "product",
    entity_id: product.id,
    changes: { name: product.name, category: product.category },
  });

  return NextResponse.json({ product });
}
