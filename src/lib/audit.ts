import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditEntry {
  user_id: number;
  user_email: string;
  action: string; // "update_quote" | "archive_quote" | "create_note" | "delete_note" | "update_settings"
  entity_type: string; // "quote" | "note" | "settings"
  entity_id?: number;
  changes?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  await supabase.from("audit_log").insert(entry);
}
