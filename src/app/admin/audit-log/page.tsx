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

const ACTION_LABELS: Record<string, string> = {
  update_quote: "Updated contact",
  archive_quote: "Archived contact",
  unarchive_quote: "Restored contact",
  create_note: "Added note",
  delete_note: "Deleted note",
  update_settings: "Updated settings",
};

export default function AuditLogPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/audit-log")
      .then((r) => {
        if (r.status === 403) {
          setError("Admin access required");
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d) {
          setEntries(d.entries || []);
          setLoading(false);
        }
      });
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

  function formatChanges(changes?: Record<string, unknown>) {
    if (!changes) return null;
    return Object.entries(changes)
      .map(([key, val]) => `${key}: ${typeof val === "object" ? JSON.stringify(val) : String(val)}`)
      .join(", ");
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
          {entries.map((entry, i) => (
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
                  <span className="text-catalyst-red font-medium">{entry.user_email.split("@")[0]}</span>
                  {" "}
                  <span className="text-catalyst-grey-300">
                    {ACTION_LABELS[entry.action] || entry.action}
                  </span>
                  {entry.entity_id && (
                    <span className="text-catalyst-grey-500"> #{entry.entity_id}</span>
                  )}
                </p>
                {entry.changes && (
                  <p className="text-xs text-catalyst-grey-500 mt-0.5 truncate" title={formatChanges(entry.changes) || ""}>
                    {formatChanges(entry.changes)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
