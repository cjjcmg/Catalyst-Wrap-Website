import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DEFAULT_USERS = [
  { email: "chris@catalystmotorsport.com", name: "Chris", role: "admin" as const, password: "Catalyst2026!" },
  { email: "jarod@catalystmotorsport.com", name: "Jarod", role: "user" as const, password: "Catalyst2026!" },
  { email: "oveis@catalystmotorsport.com", name: "Oveis", role: "user" as const, password: "Catalyst2026!" },
];

export async function POST(request: Request) {
  const { secret } = await request.json();

  if (secret !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];

  for (const user of DEFAULT_USERS) {
    const password_hash = await hashPassword(user.password);

    const { data, error } = await supabase
      .from("users")
      .upsert(
        { email: user.email, name: user.name, role: user.role, password_hash },
        { onConflict: "email" }
      )
      .select()
      .single();

    results.push({ email: user.email, success: !error, error: error?.message });
  }

  return NextResponse.json({ results });
}
