import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NewContactInput {
  id: number;
  name: string;
  service?: string | null;
  source?: string | null;
  assigned_agent_id?: number | null;
  label?: string | null;
}

export async function notifyNewContact(contact: NewContactInput) {
  let agentIds: number[] = [];

  if (contact.assigned_agent_id) {
    agentIds = [contact.assigned_agent_id];
  } else {
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .or("disabled.is.null,disabled.eq.false");

    if (error) {
      console.error("notifyNewContact: failed to load agents:", error);
      return;
    }
    agentIds = (users || []).map((u) => u.id);
  }

  if (agentIds.length === 0) return;

  const descriptor = contact.label === "client" ? "client" : "lead";
  const sourceSuffix = contact.source && contact.source !== "manual" ? ` (${contact.source})` : "";
  const title = `New ${descriptor}: ${contact.name}${sourceSuffix}`;
  const message = contact.service ? `Service: ${contact.service}` : null;
  const link = `/admin/crm/contacts/${contact.id}`;

  const rows = agentIds.map((agent_id) => ({
    agent_id,
    type: "new_contact",
    title,
    message,
    link,
    is_read: false,
  }));

  const { error } = await supabase.from("crm_notifications").insert(rows);
  if (error) {
    console.error("notifyNewContact: failed to insert notifications:", error);
  }
}
