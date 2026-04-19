import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

const STATUSES = ["draft", "sent_to_square", "pending_payment", "paid", "void"] as const;
const TYPES = ["deposit", "balance", "full"] as const;

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const contactId = searchParams.get("contact_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("invoices")
    .select(`
      id, invoice_number, type, status, amount, paid_at, sent_to_square_at,
      square_invoice_id, square_public_url, sales_quote_id, contact_id,
      created_at, updated_at,
      sales_quotes:sales_quote_id ( quote_number, assigned_agent_id ),
      quotes:contact_id ( id, name, email )
    `)
    .order("created_at", { ascending: false })
    .limit(500);

  if (status && (STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
  if (type && (TYPES as readonly string[]).includes(type)) query = query.eq("type", type);
  if (contactId) query = query.eq("contact_id", Number(contactId));
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  return NextResponse.json({ invoices: data || [] });
}
