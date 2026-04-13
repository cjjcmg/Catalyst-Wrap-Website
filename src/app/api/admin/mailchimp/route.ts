import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUser } from "@/lib/get-user";
import { fullSyncToMailchimp, fullSyncFromMailchimp } from "@/lib/mailchimp";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: Full sync (push all contacts to Mailchimp + pull unsubscribes back)
export async function POST(request: Request) {
  const user = await getUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { direction } = await request.json().catch(() => ({ direction: "both" }));

  const results: Record<string, unknown> = {};

  // Push to Mailchimp
  if (direction === "both" || direction === "push") {
    const { data: contacts } = await supabase
      .from("quotes")
      .select("email, first_name, last_name, phone, service, vehicle, contact_tag, contact_status, label, source, street, city, state, zip, subscribed")
      .eq("archived", false);

    if (contacts) {
      const pushResult = await fullSyncToMailchimp(contacts);
      results.push = pushResult;
    }
  }

  // Pull from Mailchimp (unsubscribes)
  if (direction === "both" || direction === "pull") {
    const pullResult = await fullSyncFromMailchimp(supabase);
    results.pull = pullResult;
  }

  return NextResponse.json({ success: true, results });
}
