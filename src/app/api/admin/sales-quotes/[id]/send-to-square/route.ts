import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { createSquareInvoice, isSquareConfigured } from "@/lib/square";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

/**
 * Staff-triggered: turn an accepted quote into a Square invoice for deposit,
 * balance, or full. Creates a local `invoices` row with
 * status='pending_payment' once the Square invoice is published. First
 * invoice on a quote flips it to 'converted'.
 */
export async function POST(request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSquareConfigured()) {
    return NextResponse.json(
      { error: "Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID in .env.local." },
      { status: 503 }
    );
  }

  const { id } = await params;
  const qid = Number(id);
  if (!qid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const type = body.type as "deposit" | "balance" | "full";
  if (!["deposit", "balance", "full"].includes(type)) {
    return NextResponse.json({ error: "type must be one of deposit | balance | full" }, { status: 400 });
  }

  const { data: quote, error: qErr } = await supabase
    .from("sales_quotes")
    .select("id, quote_number, status, total, deposit_amount_calc, contact_id")
    .eq("id", qid)
    .single();

  if (qErr || !quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  if (quote.status !== "accepted" && quote.status !== "converted") {
    return NextResponse.json(
      { error: `Only accepted (or already-converted) quotes can be invoiced — this quote is '${quote.status}'.` },
      { status: 409 }
    );
  }

  // Compute the invoice amount
  const quoteTotal = Number(quote.total);
  let amount = 0;
  if (type === "full") {
    amount = quoteTotal;
  } else if (type === "deposit") {
    if (!quote.deposit_amount_calc || Number(quote.deposit_amount_calc) <= 0) {
      return NextResponse.json(
        { error: "This quote has no deposit configured. Use 'full' or set a deposit on the quote first." },
        { status: 400 }
      );
    }
    amount = Number(quote.deposit_amount_calc);
  } else if (type === "balance") {
    // Balance = quote total − sum of prior non-void invoice amounts for this quote
    const { data: priors } = await supabase
      .from("invoices")
      .select("amount, status")
      .eq("sales_quote_id", qid);
    const priorTotal = (priors || [])
      .filter((p) => p.status !== "void")
      .reduce((s, p) => s + Number(p.amount || 0), 0);
    amount = +(quoteTotal - priorTotal).toFixed(2);
    if (amount <= 0) {
      return NextResponse.json(
        { error: `No balance remaining on this quote (quote total $${quoteTotal.toFixed(2)} is already fully invoiced).` },
        { status: 400 }
      );
    }
  }

  // Create the Square invoice
  let squareResult;
  try {
    squareResult = await createSquareInvoice({
      contactId: quote.contact_id,
      salesQuoteId: quote.id,
      quoteNumber: quote.quote_number,
      type,
      amountCents: Math.round(amount * 100),
      description: `${type === "deposit" ? "Deposit" : type === "balance" ? "Balance" : "Payment"} for quote ${quote.quote_number}.`,
    });
  } catch (e) {
    console.error("createSquareInvoice failed:", e);
    const msg = e instanceof Error ? e.message : "Square invoice creation failed";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Insert local invoice record
  const { data: invoice, error: insErr } = await supabase
    .from("invoices")
    .insert({
      sales_quote_id: qid,
      contact_id: quote.contact_id,
      type,
      amount,
      status: "pending_payment",
      square_invoice_id: squareResult.squareInvoiceId,
      square_public_url: squareResult.squarePublicUrl,
      sent_to_square_at: new Date().toISOString(),
      created_by_user_id: user.id,
    })
    .select()
    .single();

  if (insErr || !invoice) {
    console.error("Failed to persist invoice row:", insErr);
    return NextResponse.json(
      {
        error: "Square invoice was created but we couldn't save it locally. Square ID: " + squareResult.squareInvoiceId,
        square_invoice_id: squareResult.squareInvoiceId,
      },
      { status: 500 }
    );
  }

  // Flip quote to 'converted' on first invoice
  if (quote.status !== "converted") {
    await supabase.from("sales_quotes").update({ status: "converted" }).eq("id", qid);
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "create_square_invoice",
    entity_type: "invoice",
    entity_id: invoice.id,
    changes: {
      invoice_number: invoice.invoice_number,
      type,
      amount,
      square_invoice_id: squareResult.squareInvoiceId,
    },
  });

  return NextResponse.json({ invoice });
}
