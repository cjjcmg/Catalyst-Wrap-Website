import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const [{ data: invoice }, { data: payments }] = await Promise.all([
    supabase
      .from("invoices")
      .select(`
        *,
        sales_quotes:sales_quote_id ( id, quote_number, total, status, assigned_agent_id ),
        quotes:contact_id ( id, name, email, phone )
      `)
      .eq("id", iid)
      .single(),
    supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", iid)
      .order("paid_at", { ascending: false }),
  ]);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice, payments: payments || [] });
}
