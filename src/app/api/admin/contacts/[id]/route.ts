import { NextResponse } from "next/server";
import { getUser } from "@/lib/get-user";
import { supabase } from "@/lib/supabase";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cid = Number(id);
  if (!cid) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const { data, error } = await supabase
    .from("quotes")
    .select(`
      id, name, email, phone, vehicle, message, service, source,
      contact_tag, contact_status, assigned_agent_id, estimated_value,
      vehicle_year, vehicle_make, vehicle_model, vehicle_color,
      square_customer_id, created_at, last_contact_date, text_updates
    `)
    .eq("id", cid)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ contact: data });
}
