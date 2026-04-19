import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";
import { logAudit } from "@/lib/audit";

const ALLOWED_FIELDS = [
  "default_tax_rate",
  "default_expiration_days",
  "default_terms",
  "logo_url",
  "square_location_id",
  "notification_email",
  "business_name",
  "business_address",
  "business_phone",
  "business_website",
] as const;

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("invoicing_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Settings row missing — run Phase 1 migration" }, { status: 500 });
  }
  return NextResponse.json({ settings: data });
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const patch: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] === undefined) continue;
    patch[key] = body[key];
  }

  if (typeof patch.default_tax_rate === "string") patch.default_tax_rate = Number(patch.default_tax_rate);
  if (typeof patch.default_expiration_days === "string") patch.default_expiration_days = Number(patch.default_expiration_days);

  if (patch.default_tax_rate != null) {
    const r = Number(patch.default_tax_rate);
    if (Number.isNaN(r) || r < 0 || r > 1) {
      return NextResponse.json({ error: "Tax rate must be a decimal between 0 and 1 (e.g. 0.0775)" }, { status: 400 });
    }
  }
  if (patch.default_expiration_days != null) {
    const d = Number(patch.default_expiration_days);
    if (!Number.isInteger(d) || d < 1 || d > 365) {
      return NextResponse.json({ error: "Expiration days must be 1–365" }, { status: 400 });
    }
  }
  if (typeof patch.notification_email === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patch.notification_email)) {
    return NextResponse.json({ error: "Invalid notification email" }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("invoicing_settings")
    .update(patch)
    .eq("id", 1)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }

  await logAudit({
    user_id: user.id,
    user_email: user.email,
    action: "update_invoicing_settings",
    entity_type: "invoicing_settings",
    entity_id: 1,
    changes: patch,
  });

  return NextResponse.json({ settings: data });
}
