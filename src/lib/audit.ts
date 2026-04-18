import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuditEntry {
  user_id: number | null;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  changes?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  await supabase.from("audit_log").insert(entry);
}
