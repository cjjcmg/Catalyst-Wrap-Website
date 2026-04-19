"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Contact {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  contact_tag: string | null;
  contact_status: string | null;
  assigned_agent_id: number | null;
  estimated_value: number | null;
  last_contact_date: string | null;
  label: string | null;
  source: string | null;
}

interface Agent {
  id: number;
  name: string;
}

const TAG_COLORS: Record<string, string> = {
  A: "bg-green-500 text-white",
  B: "bg-amber-500 text-black",
  C: "bg-red-500 text-white",
  "!": "bg-violet-500 text-white",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  accepted: "Accepted",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  past_client: "Past Client",
  lost: "Lost",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  contacted: "bg-cyan-500/15 text-cyan-400",
  quoted: "bg-purple-500/15 text-purple-400",
  accepted: "bg-emerald-500/15 text-emerald-400",
  scheduled: "bg-amber-500/15 text-amber-400",
  in_progress: "bg-orange-500/15 text-orange-400",
  completed: "bg-green-500/15 text-green-400",
  past_client: "bg-catalyst-grey-500/15 text-catalyst-grey-400",
  lost: "bg-red-500/15 text-red-400",
};

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function CRMContactsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState(searchParams.get("tag") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [agentFilter, setAgentFilter] = useState("");
  const [sort, setSort] = useState("newest");

  // Keep URL search params in sync with active filters so state is
  // bookmarkable and the dashboard's pipeline links always reflect the
  // current view.
  useEffect(() => {
    const params = new URLSearchParams();
    if (tagFilter) params.set("tag", tagFilter);
    if (statusFilter) params.set("status", statusFilter);
    const qs = params.toString();
    const url = qs ? `/admin/crm/contacts?${qs}` : "/admin/crm/contacts";
    router.replace(url);
  }, [tagFilter, statusFilter, router]);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/quotes").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()).catch(() => ({ users: [] })),
    ]).then(([q, u]) => {
      setContacts(q.quotes || []);
      setAgents((u.users || []).filter((a: Agent & { disabled?: boolean }) => !a.disabled));
      setLoading(false);
    });
  }, []);

  async function cycleTag(id: number, currentTag: string | null) {
    const order = [null, "A", "B", "C", "!"];
    const idx = order.indexOf(currentTag);
    const nextTag = order[(idx + 1) % order.length];

    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, contact_tag: nextTag }),
    });
    if (res.ok) {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, contact_tag: nextTag } : c)));
    }
  }

  async function assignAgent(id: number, agentId: number | null) {
    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, assigned_agent_id: agentId }),
    });
    if (res.ok) {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, assigned_agent_id: agentId } : c)));
    }
  }

  const filtered = contacts
    .filter((c) => {
      if (tagFilter === "__none" && c.contact_tag) return false;
      if (tagFilter && tagFilter !== "__none" && c.contact_tag !== tagFilter) return false;
      if (statusFilter && c.contact_status !== statusFilter) return false;
      if (agentFilter && String(c.assigned_agent_id) !== agentFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.service || "").toLowerCase().includes(s) ||
        (c.vehicle || "").toLowerCase().includes(s)
      );
    })
    .sort((a, b) => {
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "needs-attention") {
        const aDate = a.last_contact_date ? new Date(a.last_contact_date).getTime() : 0;
        const bDate = b.last_contact_date ? new Date(b.last_contact_date).getTime() : 0;
        return aDate - bDate;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => router.push("/admin/crm")} className="text-catalyst-grey-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Contacts</h1>
          <span className="text-catalyst-grey-500 text-sm">({filtered.length})</span>
          {statusFilter && (
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[statusFilter] || "bg-catalyst-grey-500/15 text-catalyst-grey-400"}`}>
              {STATUS_LABELS[statusFilter] || statusFilter}
              <button onClick={() => setStatusFilter("")} className="hover:text-white" aria-label="Clear status filter">✕</button>
            </span>
          )}
          {tagFilter && (
            <span className="inline-flex items-center gap-2 rounded-full bg-catalyst-grey-500/15 text-catalyst-grey-300 px-3 py-1 text-xs font-medium">
              {tagFilter === "__none" ? "Untagged" : `Tag ${tagFilter}`}
              <button onClick={() => setTagFilter("")} className="hover:text-white" aria-label="Clear tag filter">✕</button>
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-catalyst-grey-600"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black pl-9 pr-4 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none" />
        </div>
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none">
          <option value="">All tags</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
          <option value="!">! Needs Attention</option>
          <option value="__none">Untagged</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none">
          <option value="">All agents</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="needs-attention">Needs Attention</option>
        </select>
      </div>

      {/* Contact list */}
      {loading ? (
        <p className="text-catalyst-grey-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-catalyst-grey-500 text-sm">No contacts match your filters.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-catalyst-border bg-catalyst-card p-3 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
              onClick={() => router.push(`/admin/crm/contacts/${c.id}`)}
            >
              {/* Tag button */}
              <button
                onClick={(e) => { e.stopPropagation(); cycleTag(c.id, c.contact_tag); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  c.contact_tag ? TAG_COLORS[c.contact_tag] : "bg-catalyst-border text-catalyst-grey-500"
                }`}
                title={`Tag: ${c.contact_tag || "None"} (click to cycle)`}
              >
                {c.contact_tag || "—"}
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white font-medium">{c.name}</p>
                  {c.contact_status && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contact_status] || "bg-catalyst-grey-500/15 text-catalyst-grey-400"}`}>
                      {STATUS_LABELS[c.contact_status] || c.contact_status}
                    </span>
                  )}
                  {c.estimated_value && (
                    <span className="text-xs text-green-400">${c.estimated_value.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-catalyst-grey-400 mt-0.5">
                  <span className="truncate">{c.email}</span>
                  <span className="whitespace-nowrap">{formatPhone(c.phone)}</span>
                </div>
                {c.service && (
                  <p className="text-xs text-catalyst-grey-500 mt-0.5">{c.service}{c.vehicle ? ` — ${c.vehicle}` : ""}</p>
                )}
              </div>

              {/* Quick actions + agent */}
              <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <a href={`tel:${c.phone}`} className="tooltip text-catalyst-grey-600 hover:text-green-400 transition-colors" data-tip="Call">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                </a>
                <a href={`sms:${c.phone}`} className="tooltip text-catalyst-grey-600 hover:text-blue-400 transition-colors" data-tip="Text">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                </a>
                <select
                  value={c.assigned_agent_id || ""}
                  onChange={(e) => assignAgent(c.id, e.target.value ? Number(e.target.value) : null)}
                  className="rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-xs text-catalyst-grey-400 focus:outline-none appearance-none max-w-[80px]"
                >
                  <option value="">Unassigned</option>
                  {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CRMContactsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-6"><p className="text-catalyst-grey-500">Loading...</p></div>}>
      <CRMContactsInner />
    </Suspense>
  );
}
