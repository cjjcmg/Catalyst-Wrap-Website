import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

/**
 * Revenue dashboard aggregator.
 *
 * Pulls from invoicing_revenue_rollup (one row per payment), paid invoices,
 * outstanding, and the quote funnel to compute:
 *   - KPI cards: total paid, outstanding, quotes sent, acceptance rate,
 *     avg deal size, avg conversion time
 *   - Chart series: revenue by month (rolling 12), revenue by category
 *     (pie), quote funnel stages
 *   - Tables: top customers, top salespeople, all paid invoices in range
 *
 * Query params:
 *   from=YYYY-MM-DD   (inclusive)
 *   to=YYYY-MM-DD     (inclusive)
 *   preset=today|week|month|quarter|ytd|all
 */

function resolveRange(searchParams: URLSearchParams): { from: Date; to: Date; label: string } {
  const now = new Date();
  const preset = searchParams.get("preset");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  if (fromParam && toParam) {
    return {
      from: new Date(`${fromParam}T00:00:00`),
      to: new Date(`${toParam}T23:59:59.999`),
      label: "custom",
    };
  }

  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { from: startOfToday, to: endOfToday, label: "today" };
    case "week": {
      const from = new Date(startOfToday);
      const dow = from.getDay();
      from.setDate(from.getDate() - dow); // Sunday
      return { from, to: endOfToday, label: "week" };
    }
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: endOfToday, label: "month" };
    }
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3);
      const from = new Date(now.getFullYear(), q * 3, 1);
      return { from, to: endOfToday, label: "quarter" };
    }
    case "ytd":
    default: {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to: endOfToday, label: preset || "ytd" };
    }
  }
}

interface RevenueRollupRow {
  paid_date: string;
  paid_month: string;
  amount: number;
  invoice_type: "deposit" | "balance" | "full";
  contact_id: number;
  assigned_agent_id: number | null;
  vehicle_size_tier: string;
  payment_id: number;
  invoice_id: number;
  sales_quote_id: number;
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const { from, to, label } = resolveRange(searchParams);
  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  // 1. Revenue in range (from the view — one row per payment)
  const { data: rollup } = await supabase
    .from("invoicing_revenue_rollup")
    .select("*")
    .gte("paid_date", from.toISOString().slice(0, 10))
    .lte("paid_date", to.toISOString().slice(0, 10));

  const rollupRows = (rollup || []) as RevenueRollupRow[];
  const totalPaid = rollupRows.reduce((s, r) => s + Number(r.amount), 0);

  // 2. Outstanding (live total from invoices table — not scoped to range)
  const { data: outstandingRows } = await supabase
    .from("invoices")
    .select("amount")
    .eq("status", "pending_payment");
  const outstanding = (outstandingRows || []).reduce((s, i) => s + Number(i.amount), 0);

  // 3. Quotes sent / accepted / conversion metrics in range
  const { data: quotesInRange } = await supabase
    .from("sales_quotes")
    .select("id, total, status, sent_at, accepted_at, created_at")
    .gte("created_at", fromIso)
    .lte("created_at", toIso);
  const allQuotes = quotesInRange || [];
  const sentCount = allQuotes.filter((q) => q.sent_at).length;
  const acceptedInRange = allQuotes.filter((q) => q.accepted_at);
  const acceptedCount = acceptedInRange.length;
  const acceptanceRate = sentCount > 0 ? acceptedCount / sentCount : 0;
  const avgDealSize = acceptedCount > 0
    ? acceptedInRange.reduce((s, q) => s + Number(q.total), 0) / acceptedCount
    : 0;
  const conversionTimes = acceptedInRange
    .map((q) => q.sent_at && q.accepted_at ? new Date(q.accepted_at).getTime() - new Date(q.sent_at).getTime() : null)
    .filter((n): n is number => n != null && n > 0);
  const avgConversionMs = conversionTimes.length > 0
    ? conversionTimes.reduce((s, n) => s + n, 0) / conversionTimes.length
    : 0;
  const avgConversionHours = avgConversionMs / (1000 * 60 * 60);

  // 4. Revenue by month (rolling 12 from rollup table, not filtered by range)
  const twelveMonthsAgo = new Date(); twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11); twelveMonthsAgo.setDate(1); twelveMonthsAgo.setHours(0, 0, 0, 0);
  const { data: rollup12 } = await supabase
    .from("invoicing_revenue_rollup")
    .select("paid_month, amount")
    .gte("paid_date", twelveMonthsAgo.toISOString().slice(0, 10));
  const byMonthMap = new Map<string, number>();
  for (let i = 0; i < 12; i++) {
    const d = new Date(twelveMonthsAgo); d.setMonth(d.getMonth() + i);
    const key = d.toISOString().slice(0, 7); // YYYY-MM
    byMonthMap.set(key, 0);
  }
  for (const row of (rollup12 || []) as Array<{ paid_month: string; amount: number }>) {
    const key = row.paid_month.slice(0, 7);
    byMonthMap.set(key, (byMonthMap.get(key) || 0) + Number(row.amount));
  }
  const revenueByMonth = Array.from(byMonthMap.entries()).map(([month, amount]) => ({ month, amount: +amount.toFixed(2) }));

  // 5. Revenue by category — join payments → invoices → sales_quote_line_items → products
  // Simpler: pull paid invoices in range with their quote's line items' product category
  const paidInvoiceIds = rollupRows.map((r) => r.invoice_id);
  let byCategory: Array<{ category: string; amount: number }> = [];
  if (paidInvoiceIds.length > 0) {
    const { data: invoiceQuotes } = await supabase
      .from("invoices")
      .select(`
        id, amount,
        sales_quotes:sales_quote_id (
          total,
          sales_quote_line_items ( line_total, products:product_id ( category ) )
        )
      `)
      .in("id", paidInvoiceIds);

    const catTotals = new Map<string, number>();
    type InvQuoteRow = {
      amount: number;
      sales_quotes: { total: number; sales_quote_line_items: Array<{ line_total: number; products: { category: string } | null }> } | null;
    };
    const rows = (invoiceQuotes || []) as unknown as InvQuoteRow[];
    for (const inv of rows) {
      const quote = inv.sales_quotes;
      if (!quote) continue;
      const quoteTotal = Number(quote.total);
      if (quoteTotal <= 0) continue;
      const invAmount = Number(inv.amount);
      for (const li of quote.sales_quote_line_items || []) {
        const cat = li.products?.category || "other";
        const share = (Number(li.line_total) / quoteTotal) * invAmount;
        catTotals.set(cat, (catTotals.get(cat) || 0) + share);
      }
    }
    byCategory = Array.from(catTotals.entries())
      .map(([category, amount]) => ({ category, amount: +amount.toFixed(2) }))
      .sort((a, b) => b.amount - a.amount);
  }

  // 6. Quote funnel for the range
  const funnel = {
    sent: allQuotes.filter((q) => q.sent_at).length,
    viewed: allQuotes.filter((q) => ["viewed", "accepted", "declined", "converted"].includes(q.status)).length,
    accepted: allQuotes.filter((q) => ["accepted", "converted"].includes(q.status)).length,
    paid: rollupRows.length,
  };

  // 7. Top customers (by paid amount in range)
  const customerTotals = new Map<number, number>();
  for (const r of rollupRows) {
    customerTotals.set(r.contact_id, (customerTotals.get(r.contact_id) || 0) + Number(r.amount));
  }
  const topCustomerIds = Array.from(customerTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const customerNames: Record<number, string> = {};
  if (topCustomerIds.length > 0) {
    const { data: custRows } = await supabase
      .from("quotes")
      .select("id, name")
      .in("id", topCustomerIds.map(([id]) => id));
    for (const c of custRows || []) customerNames[c.id] = c.name;
  }
  const topCustomers = topCustomerIds.map(([id, amount]) => ({
    contact_id: id,
    name: customerNames[id] || "—",
    amount: +amount.toFixed(2),
  }));

  // 8. Top salespeople
  const agentTotals = new Map<number, number>();
  for (const r of rollupRows) {
    if (r.assigned_agent_id != null) {
      agentTotals.set(r.assigned_agent_id, (agentTotals.get(r.assigned_agent_id) || 0) + Number(r.amount));
    }
  }
  const topAgentIds = Array.from(agentTotals.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const agentNames: Record<number, string> = {};
  if (topAgentIds.length > 0) {
    const { data: agentRows } = await supabase
      .from("users")
      .select("id, name")
      .in("id", topAgentIds.map(([id]) => id));
    for (const u of agentRows || []) agentNames[u.id] = u.name;
  }
  const topSalespeople = topAgentIds.map(([id, amount]) => ({
    agent_id: id,
    name: agentNames[id] || "—",
    amount: +amount.toFixed(2),
  }));

  return NextResponse.json({
    range: { from: fromIso, to: toIso, label },
    kpi: {
      total_paid: +totalPaid.toFixed(2),
      outstanding: +outstanding.toFixed(2),
      quotes_sent: sentCount,
      acceptance_rate: +acceptanceRate.toFixed(4),
      avg_deal_size: +avgDealSize.toFixed(2),
      avg_conversion_hours: +avgConversionHours.toFixed(1),
    },
    revenue_by_month: revenueByMonth,
    revenue_by_category: byCategory,
    funnel,
    top_customers: topCustomers,
    top_salespeople: topSalespeople,
  });
}
