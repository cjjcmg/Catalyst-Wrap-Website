import mailchimp from "@mailchimp/mailchimp_marketing";
import crypto from "crypto";

mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX || "us21",
});

const LIST_ID = process.env.MAILCHIMP_LIST_ID || "";

function subscriberHash(email: string) {
  return crypto.createHash("md5").update(email.toLowerCase()).digest("hex");
}

interface ContactData {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  service?: string | null;
  vehicle?: string | null;
  contact_tag?: string | null;
  contact_status?: string | null;
  label?: string | null;
  source?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  subscribed?: boolean;
}

export async function pushContactToMailchimp(contact: ContactData) {
  const hash = subscriberHash(contact.email);
  const status = contact.subscribed === false ? "unsubscribed" : "subscribed";

  const mergeFields: Record<string, unknown> = {};
  if (contact.first_name) mergeFields.FNAME = contact.first_name;
  if (contact.last_name) mergeFields.LNAME = contact.last_name;
  if (contact.phone) mergeFields.PHONE = contact.phone;
  if (contact.service) mergeFields.SERVICE = contact.service;
  if (contact.vehicle) mergeFields.VEHICLE = contact.vehicle;
  if (contact.contact_tag) mergeFields.CTAG = contact.contact_tag;
  if (contact.contact_status) mergeFields.CSTATUS = contact.contact_status;
  if (contact.label) mergeFields.LABEL = contact.label;
  if (contact.source) mergeFields.SOURCE = contact.source;

  if (contact.street || contact.city || contact.state || contact.zip) {
    mergeFields.ADDRESS = {
      addr1: contact.street || "",
      addr2: "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
      country: "US",
    };
  }

  // Build Mailchimp tags from contact_tag and label
  const tags: string[] = [];
  if (contact.contact_tag) tags.push(`Tag: ${contact.contact_tag}`);
  if (contact.label) tags.push(contact.label);
  if (contact.contact_status) tags.push(contact.contact_status);

  try {
    // Use PUT for upsert (create or update)
    await mailchimp.lists.setListMember(LIST_ID, hash, {
      email_address: contact.email,
      status_if_new: status,
      status: status,
      merge_fields: mergeFields,
    } as mailchimp.lists.SetListMemberBody);

    // Update tags separately
    if (tags.length > 0) {
      await mailchimp.lists.updateListMemberTags(LIST_ID, hash, {
        tags: tags.map((t) => ({ name: t, status: "active" as const })),
      });
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Mailchimp push error:", message);
    return { success: false, error: message };
  }
}

export async function pullSubscriptionFromMailchimp(email: string): Promise<boolean | null> {
  const hash = subscriberHash(email);

  try {
    const member = await mailchimp.lists.getListMember(LIST_ID, hash);
    // Return true if subscribed, false if unsubscribed/cleaned
    return (member as { status: string }).status === "subscribed";
  } catch {
    // Member not found in Mailchimp
    return null;
  }
}

export async function pullAllUnsubscribes(): Promise<string[]> {
  const unsubscribed: string[] = [];
  let offset = 0;
  const count = 100;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await mailchimp.lists.getListMembersInfo(LIST_ID, {
      status: "unsubscribed",
      count,
      offset,
    });

    const members = (res as { members: Array<{ email_address: string }> }).members;
    if (!members || members.length === 0) break;

    members.forEach((m) => unsubscribed.push(m.email_address.toLowerCase()));
    offset += count;
    if (members.length < count) break;
  }

  return unsubscribed;
}

export async function fullSyncToMailchimp(
  contacts: ContactData[]
): Promise<{ pushed: number; errors: number }> {
  let pushed = 0;
  let errors = 0;

  for (const contact of contacts) {
    const result = await pushContactToMailchimp(contact);
    if (result.success) pushed++;
    else errors++;
  }

  return { pushed, errors };
}

export async function fullSyncFromMailchimp(
  supabase: ReturnType<typeof import("@supabase/supabase-js").createClient>
): Promise<{ updated: number }> {
  const unsubscribed = await pullAllUnsubscribes();
  let updated = 0;

  for (const email of unsubscribed) {
    const { error } = await supabase
      .from("quotes")
      .update({ subscribed: false })
      .eq("email", email)
      .eq("subscribed", true);

    if (!error) updated++;
  }

  return { updated };
}
