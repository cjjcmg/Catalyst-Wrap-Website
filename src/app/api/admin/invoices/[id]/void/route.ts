import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { isSquareConfigured, voidSquareInvoice } from "@/lib/square";
import { logAudit } from "@/lib/audit";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { id } = await params;
  const iid = Number(id);
  if (!iid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, square_invoice_id")
    .eq("id", iid)
    .single();

  if (error || !invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  if (invoice.status === "paid") {
    return NextResponse.json(
      { error: "Cannot void a paid invoice — refund the payment instead." },
      { status: 409 }
    );
  }
  if (invoice.status === "void") {
    return NextResponse.json({ error: "Invoice is already void" }, { status: 409 });
  }

  // Cancel on Square (if a square invoice id is stored) then flip locally.
  if (invoice.square_invoice_id && isSquareConfigured()) {
    try {
      await voidSquareInvoice(invoice.square_invoice_id);
    } catch (e) {
      console.error("voidSquareInvoice failed:", e);
      const msg = e instanceof Error ? e.message : "Square void failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  await supabase.from("invoices").update({ status: "void" }).eq("id", iid);

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "void_invoice",
    entity_type: "invoice",
    entity_id: iid,
    changes: { invoice_number: invoice.invoice_number },
  });

  return NextResponse.json({ success: true });
}
