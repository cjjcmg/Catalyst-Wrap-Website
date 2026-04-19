import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

/**
 * CSV export of paid invoices within a date range. Pulls straight from the
 * invoicing_revenue_rollup view joined with invoices + quotes.
 */

function csvEscape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "2000-01-01";
  const to = searchParams.get("to") || new Date().toISOString().slice(0, 10);

  const { data: payments } = await supabase
    .from("invoicing_revenue_rollup")
    .select("*")
    .gte("paid_date", from)
    .lte("paid_date", to)
    .order("paid_date", { ascending: false });

  const rows = (payments || []) as Array<{
    paid_date: string;
    amount: number;
    invoice_type: string;
    invoice_id: number;
    sales_quote_id: number;
    contact_id: number;
    assigned_agent_id: number | null;
    vehicle_size_tier: string;
  }>;

  // Enrich with numbers + names
  const invoiceIds = [...new Set(rows.map((r) => r.invoice_id))];
  const contactIds = [...new Set(rows.map((r) => r.contact_id))];
  const quoteIds = [...new Set(rows.map((r) => r.sales_quote_id))];
  const agentIds = [...new Set(rows.map((r) => r.assigned_agent_id).filter((n): n is number => n != null))];

  const [{ data: invoices }, { data: contacts }, { data: quotes }, { data: agents }] = await Promise.all([
    invoiceIds.length > 0 ? supabase.from("invoices").select("id, invoice_number").in("id", invoiceIds) : Promise.resolve({ data: [] }),
    contactIds.length > 0 ? supabase.from("quotes").select("id, name, email").in("id", contactIds) : Promise.resolve({ data: [] }),
    quoteIds.length > 0 ? supabase.from("sales_quotes").select("id, quote_number").in("id", quoteIds) : Promise.resolve({ data: [] }),
    agentIds.length > 0 ? supabase.from("users").select("id, name").in("id", agentIds) : Promise.resolve({ data: [] }),
  ]);

  const invById: Record<number, { invoice_number: string }> = {};
  for (const i of invoices || []) invById[i.id] = i;
  const contactById: Record<number, { name: string; email: string }> = {};
  for (const c of contacts || []) contactById[c.id] = c;
  const quoteById: Record<number, { quote_number: string }> = {};
  for (const q of quotes || []) quoteById[q.id] = q;
  const agentById: Record<number, { name: string }> = {};
  for (const a of agents || []) agentById[a.id] = a;

  const header = [
    "Paid date",
    "Invoice #",
    "Quote #",
    "Customer name",
    "Customer email",
    "Type",
    "Amount",
    "Size tier",
    "Salesperson",
  ].join(",");

  const body = rows.map((r) => {
    const inv = invById[r.invoice_id];
    const c = contactById[r.contact_id];
    const q = quoteById[r.sales_quote_id];
    const a = r.assigned_agent_id != null ? agentById[r.assigned_agent_id] : null;
    return [
      csvEscape(r.paid_date),
      csvEscape(inv?.invoice_number),
      csvEscape(q?.quote_number),
      csvEscape(c?.name),
      csvEscape(c?.email),
      csvEscape(r.invoice_type),
      csvEscape(Number(r.amount).toFixed(2)),
      csvEscape(r.vehicle_size_tier),
      csvEscape(a?.name),
    ].join(",");
  }).join("\n");

  const csv = header + "\n" + body + "\n";
  const filename = `catalyst-revenue-${from}-to-${to}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
