"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuditEntry {
  id: number;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id?: number;
  changes?: Record<string, unknown>;
  created_at: string;
}

interface QuoteInfo {
  id: number;
  name: string;
  email: string;
}

const ACTION_LABELS: Record<string, string> = {
  update_quote: "edited contact",
  archive_quote: "archived contact",
  unarchive_quote: "restored contact",
  create_note: "added a note on",
  delete_note: "deleted a note on",
  update_settings: "updated settings",
  update_appointment: "updated appointment for",
  create_appointment: "scheduled appointment for",
  cancel_appointment: "cancelled appointment for",
  delete_appointment: "deleted appointment for",
  send_welcome_email: "sent welcome email to",
};

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [quotes, setQuotes] = useState<Map<number, QuoteInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/audit-log");
      if (res.status === 403) {
        setError("Admin access required");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setEntries(data.entries || []);

      // Gather unique quote/note entity IDs to look up names
      const quoteIds = new Set<number>();
      for (const e of data.entries || []) {
        if (e.entity_id) {
          if (e.entity_type === "quote") {
            quoteIds.add(e.entity_id);
          } else if ((e.entity_type === "note" || e.entity_type === "appointment") && e.changes?.quote_id) {
            quoteIds.add(e.changes.quote_id as number);
          }
        }
      }

      // Fetch quote info for each
      const qMap = new Map<number, QuoteInfo>();
      await Promise.all(
        Array.from(quoteIds).map(async (id) => {
          const qRes = await fetch(`/api/admin/quotes?id=${id}`);
          if (qRes.ok) {
            const qData = await qRes.json();
            if (qData.quote) {
              qMap.set(id, { id: qData.quote.id, name: qData.quote.name, email: qData.quote.email });
            }
          }
        })
      );
      setQuotes(qMap);
      setLoading(false);
    }
    load();
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getContactName(entry: AuditEntry): string | null {
    if (entry.entity_type === "quote" && entry.entity_id) {
      return quotes.get(entry.entity_id)?.name || `#${entry.entity_id}`;
    }
    if ((entry.entity_type === "note" || entry.entity_type === "appointment") && entry.changes?.quote_id) {
      return quotes.get(entry.changes.quote_id as number)?.name || `#${entry.changes.quote_id}`;
    }
    return null;
  }

  function getContactId(entry: AuditEntry): number | null {
    if (entry.entity_type === "quote" && entry.entity_id) return entry.entity_id;
    if ((entry.entity_type === "note" || entry.entity_type === "appointment") && entry.changes?.quote_id) return entry.changes.quote_id as number;
    return null;
  }

  function formatChangeSummary(entry: AuditEntry): string | null {
    if (!entry.changes) return null;
    if (entry.action === "create_note") {
      const content = entry.changes.content as string;
      return content?.length > 80 ? content.slice(0, 80) + "..." : content;
    }
    if (entry.action === "update_settings") {
      return Object.entries(entry.changes)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join(", ");
    }
    if (entry.action === "create_appointment" && entry.changes?.date_time) {
      const dt = new Date(entry.changes.date_time as string).toLocaleString("en-US", {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      const details = entry.changes.details ? ` — ${entry.changes.details}` : "";
      return `${dt}${details}`;
    }
    if (entry.action === "update_quote") {
      const fields = Object.keys(entry.changes).filter((k) => k !== "id");
      return `Changed: ${fields.join(", ")}`;
    }
    if (entry.action === "send_welcome_email") {
      const kind = entry.changes.kind as string | undefined;
      const subject = entry.changes.subject as string | undefined;
      return kind && subject ? `${kind} — ${subject}` : subject || null;
    }
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin")}
          className="text-catalyst-grey-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Audit Log</h1>
      </div>

      {error ? (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6">
          <p className="text-red-400">{error}</p>
        </div>
      ) : loading ? (
        <p className="text-catalyst-grey-500">Loading...</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6">
          <p className="text-catalyst-grey-500">No activity yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 sm:p-6 space-y-0">
          {entries.map((entry, i) => {
            const contactName = getContactName(entry);
            const contactId = getContactId(entry);
            const changeSummary = formatChangeSummary(entry);

            return (
              <div
                key={entry.id}
                className={`flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 ${
                  i < entries.length - 1 ? "border-b border-catalyst-border/50" : ""
                }`}
              >
                <p className="text-xs text-catalyst-grey-500 whitespace-nowrap sm:w-[160px] flex-shrink-0">
                  {formatDate(entry.created_at)}
                </p>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="text-catalyst-red font-medium">
                      {entry.user_email.split("@")[0]}
                    </span>
                    {" "}
                    <span className="text-catalyst-grey-300">
                      {ACTION_LABELS[entry.action] || entry.action}
                    </span>
                    {contactName && (
                      <>
                        {" "}
                        {contactId ? (
                          <button
                            onClick={() => router.push(`/admin/contact/${contactId}`)}
                            className="text-white font-medium hover:text-catalyst-red transition-colors"
                          >
                            {contactName}
                          </button>
                        ) : (
                          <span className="text-white font-medium">{contactName}</span>
                        )}
                      </>
                    )}
                  </p>
                  {changeSummary && (
                    <p className="text-xs text-catalyst-grey-500 mt-0.5 truncate">
                      {changeSummary}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
