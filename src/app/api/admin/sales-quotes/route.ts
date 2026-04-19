import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const STATUSES = ["draft", "sent", "viewed", "accepted", "declined", "expired", "converted"] as const;
const SIZE_TIERS = ["small", "mid", "suv", "truck", "exotic"] as const;
type SizeTier = (typeof SIZE_TIERS)[number];

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const agentId = searchParams.get("agent_id");
  const contactId = searchParams.get("contact_id");
  const search = searchParams.get("q");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("sales_quotes")
    .select(`
      id, quote_number, status, total, subtotal, tax_amount, discount_amount,
      deposit_amount_calc, expires_at, sent_at, accepted_at, declined_at,
      vehicle_year, vehicle_make, vehicle_model, vehicle_size_tier,
      assigned_agent_id, created_by_user_id, created_at, updated_at, contact_id,
      quotes:contact_id ( id, name, email, phone )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && STATUSES.includes(status as (typeof STATUSES)[number])) {
    query = query.eq("status", status);
  }
  if (agentId) query = query.eq("assigned_agent_id", Number(agentId));
  if (contactId) query = query.eq("contact_id", Number(contactId));
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }

  let rows = data || [];
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((r) => {
      const contact = (r as unknown as { quotes?: { name?: string; email?: string } }).quotes;
      return (
        r.quote_number?.toLowerCase().includes(s) ||
        contact?.name?.toLowerCase().includes(s) ||
        contact?.email?.toLowerCase().includes(s)
      );
    });
  }

  return NextResponse.json({ quotes: rows });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    contact_id,
    vehicle_size_tier,
    vehicle_year,
    vehicle_make,
    vehicle_model,
    vehicle_color,
    assigned_agent_id,
    tax_rate,
    discount_amount,
    discount_reason,
    deposit_type,
    deposit_value,
    customer_notes,
    internal_notes,
    terms,
    line_items,
  } = body as {
    contact_id: number;
    vehicle_size_tier: SizeTier;
    vehicle_year?: string | null;
    vehicle_make?: string | null;
    vehicle_model?: string | null;
    vehicle_color?: string | null;
    assigned_agent_id?: number | null;
    tax_rate?: number;
    discount_amount?: number;
    discount_reason?: string | null;
    deposit_type?: "fixed_amount" | "percent" | "none";
    deposit_value?: number | null;
    customer_notes?: string | null;
    internal_notes?: string | null;
    terms?: string | null;
    line_items?: Array<{
      product_id?: number | null;
      description: string;
      quantity: number;
      unit_price: number;
      is_taxable?: boolean;
      sort_order?: number;
    }>;
  };

  if (!contact_id || !Number.isInteger(contact_id)) {
    return NextResponse.json({ error: "contact_id is required" }, { status: 400 });
  }
  if (!SIZE_TIERS.includes(vehicle_size_tier)) {
    return NextResponse.json({ error: "vehicle_size_tier is required" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("invoicing_settings")
    .select("default_tax_rate, default_terms")
    .eq("id", 1)
    .single();

  const insert = {
    contact_id,
    vehicle_size_tier,
    vehicle_year: vehicle_year || null,
    vehicle_make: vehicle_make || null,
    vehicle_model: vehicle_model || null,
    vehicle_color: vehicle_color || null,
    assigned_agent_id: assigned_agent_id ?? null,
    tax_rate: tax_rate ?? settings?.default_tax_rate ?? 0.0775,
    discount_amount: discount_amount ?? 0,
    discount_reason: discount_reason || null,
    deposit_type: deposit_type ?? "none",
    deposit_value: deposit_value ?? null,
    customer_notes: customer_notes || null,
    internal_notes: internal_notes || null,
    terms: terms ?? settings?.default_terms ?? null,
    created_by_user_id: user.id,
    status: "draft" as const,
  };

  const { data: quote, error: qerr } = await supabase
    .from("sales_quotes")
    .insert(insert)
    .select()
    .single();

  if (qerr || !quote) {
    return NextResponse.json({ error: qerr?.message || "Failed to create quote" }, { status: 500 });
  }

  if (Array.isArray(line_items) && line_items.length > 0) {
    const rows = line_items.map((li, idx) => ({
      sales_quote_id: quote.id,
      product_id: li.product_id ?? null,
      description: li.description,
      quantity: Number(li.quantity) || 1,
      unit_price: Number(li.unit_price) || 0,
      line_total: (Number(li.quantity) || 1) * (Number(li.unit_price) || 0),
      is_taxable: li.is_taxable ?? true,
      sort_order: li.sort_order ?? idx * 10,
    }));
    const { error: lerr } = await supabase.from("sales_quote_line_items").insert(rows);
    if (lerr) {
      // Rollback the quote since line items failed
      await supabase.from("sales_quotes").delete().eq("id", quote.id);
      return NextResponse.json({ error: "Failed to add line items" }, { status: 500 });
    }
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "create_sales_quote",
    entity_type: "sales_quote",
    entity_id: quote.id,
    changes: { quote_number: quote.quote_number, contact_id },
  });

  const { data: full } = await supabase
    .from("sales_quotes")
    .select("*, sales_quote_line_items(*)")
    .eq("id", quote.id)
    .single();

  return NextResponse.json({ quote: full });
}
