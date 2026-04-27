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

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

type SortKey =
  | "tag"
  | "name"
  | "status"
  | "email"
  | "phone"
  | "service"
  | "vehicle"
  | "value"
  | "agent"
  | "created";

type SortDir = "asc" | "desc";

function ColumnHeader({
  label,
  sortKey,
  currentKey,
  dir,
  onSort,
  align,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
  className?: string;
}) {
  const active = currentKey === sortKey;
  const justify = align === "right" ? "justify-end" : "justify-start";
  return (
    <th
      scope="col"
      className={`px-3 py-2 font-medium select-none cursor-pointer hover:text-white transition-colors ${className || ""}`}
      onClick={() => onSort(sortKey)}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span className={`inline-flex items-center gap-1 ${justify}`}>
        {label}
        <span className={`text-[10px] leading-none ${active ? "text-catalyst-red" : "text-catalyst-grey-700"}`}>
          {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </span>
    </th>
  );
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
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showNew, setShowNew] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created" || key === "value" ? "desc" : "asc");
    }
  }

  function agentName(id: number | null) {
    if (id == null) return "";
    return agents.find((a) => a.id === id)?.name || "";
  }

  function sortValue(c: Contact, key: SortKey): string | number {
    switch (key) {
      case "tag": return c.contact_tag || "~";
      case "name": return (c.name || "").toLowerCase();
      case "status": return c.contact_status ? (STATUS_LABELS[c.contact_status] || c.contact_status) : "~";
      case "email": return (c.email || "").toLowerCase();
      case "phone": return (c.phone || "").replace(/\D/g, "");
      case "service": return (c.service || "").toLowerCase();
      case "vehicle": return (c.vehicle || "").toLowerCase();
      case "value": return c.estimated_value || 0;
      case "agent": return agentName(c.assigned_agent_id).toLowerCase() || "~";
      case "created": return new Date(c.created_at).getTime();
    }
  }

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
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv;
      } else {
        cmp = String(av).localeCompare(String(bv));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-catalyst-red px-4 py-2 text-sm font-medium text-white hover:bg-catalyst-red/90 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Contact
        </button>
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
        {/* Narrow-width sort control (column headers aren't shown below xl) */}
        <select
          value={`${sortKey}:${sortDir}`}
          onChange={(e) => {
            const [k, d] = e.target.value.split(":") as [SortKey, SortDir];
            setSortKey(k);
            setSortDir(d);
          }}
          className="xl:hidden rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none"
        >
          <option value="created:desc">Newest</option>
          <option value="created:asc">Oldest</option>
          <option value="name:asc">Name A–Z</option>
          <option value="name:desc">Name Z–A</option>
          <option value="status:asc">Status</option>
          <option value="tag:asc">Tag</option>
          <option value="value:desc">Value (high→low)</option>
          <option value="value:asc">Value (low→high)</option>
          <option value="agent:asc">Agent</option>
        </select>
      </div>

      {/* Contact table (wide screens) */}
      {loading ? (
        <p className="text-catalyst-grey-500">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-catalyst-grey-500 text-sm">No contacts match your filters.</p>
      ) : (
        <>
        <div className="hidden xl:block overflow-x-auto rounded-lg border border-catalyst-border bg-catalyst-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-catalyst-border bg-catalyst-black/40 text-left text-xs uppercase tracking-wider text-catalyst-grey-500">
                <ColumnHeader label="Tag" sortKey="tag" currentKey={sortKey} dir={sortDir} onSort={toggleSort} className="w-12" />
                <ColumnHeader label="Name" sortKey="name" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Status" sortKey="status" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Email" sortKey="email" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Phone" sortKey="phone" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Service" sortKey="service" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Vehicle" sortKey="vehicle" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Value" sortKey="value" currentKey={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                <ColumnHeader label="Agent" sortKey="agent" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <ColumnHeader label="Created" sortKey="created" currentKey={sortKey} dir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-catalyst-border/50 last:border-b-0 cursor-pointer hover:bg-white/5 transition-colors"
                  onClick={() => router.push(`/admin/crm/contacts/${c.id}`)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => cycleTag(c.id, c.contact_tag)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        c.contact_tag ? TAG_COLORS[c.contact_tag] : "bg-catalyst-border text-catalyst-grey-500"
                      }`}
                      title={`Tag: ${c.contact_tag || "None"} (click to cycle)`}
                    >
                      {c.contact_tag || "—"}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-white font-medium whitespace-nowrap">{c.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {c.contact_status ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contact_status] || "bg-catalyst-grey-500/15 text-catalyst-grey-400"}`}>
                        {STATUS_LABELS[c.contact_status] || c.contact_status}
                      </span>
                    ) : (
                      <span className="text-catalyst-grey-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-catalyst-grey-300 max-w-[220px] truncate" title={c.email}>{c.email || <span className="text-catalyst-grey-600">—</span>}</td>
                  <td className="px-3 py-2 text-catalyst-grey-300 whitespace-nowrap">{c.phone ? formatPhone(c.phone) : <span className="text-catalyst-grey-600">—</span>}</td>
                  <td className="px-3 py-2 text-catalyst-grey-300 max-w-[180px] truncate" title={c.service}>{c.service || <span className="text-catalyst-grey-600">—</span>}</td>
                  <td className="px-3 py-2 text-catalyst-grey-300 max-w-[160px] truncate" title={c.vehicle}>{c.vehicle || <span className="text-catalyst-grey-600">—</span>}</td>
                  <td className="px-3 py-2 text-right text-green-400 whitespace-nowrap">{c.estimated_value ? `$${c.estimated_value.toLocaleString()}` : <span className="text-catalyst-grey-600">—</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={c.assigned_agent_id || ""}
                      onChange={(e) => assignAgent(c.id, e.target.value ? Number(e.target.value) : null)}
                      className="rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-xs text-catalyst-grey-400 focus:outline-none appearance-none max-w-[110px]"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-catalyst-grey-400 whitespace-nowrap">{formatShortDate(c.created_at)}</td>
                  <td className="px-3 py-2 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${c.phone}`} className="text-catalyst-grey-600 hover:text-green-400 transition-colors" aria-label="Call">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                      </a>
                      <a href={`sms:${c.phone}`} className="text-catalyst-grey-600 hover:text-blue-400 transition-colors" aria-label="Text">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Responsive card layout (narrower screens) */}
        <div className="xl:hidden rounded-lg border border-catalyst-border bg-catalyst-card divide-y divide-catalyst-border/50">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="p-3 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => router.push(`/admin/crm/contacts/${c.id}`)}
            >
              {/* Row 1: tag, name, status, value, actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); cycleTag(c.id, c.contact_tag); }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    c.contact_tag ? TAG_COLORS[c.contact_tag] : "bg-catalyst-border text-catalyst-grey-500"
                  }`}
                  title={`Tag: ${c.contact_tag || "None"} (click to cycle)`}
                >
                  {c.contact_tag || "—"}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white font-medium truncate">{c.name}</p>
                    {c.contact_status && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.contact_status] || "bg-catalyst-grey-500/15 text-catalyst-grey-400"}`}>
                        {STATUS_LABELS[c.contact_status] || c.contact_status}
                      </span>
                    )}
                    {c.estimated_value ? (
                      <span className="text-xs font-medium text-green-400">${c.estimated_value.toLocaleString()}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                  <a href={`tel:${c.phone}`} className="text-catalyst-grey-600 hover:text-green-400 transition-colors" aria-label="Call">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                  </a>
                  <a href={`sms:${c.phone}`} className="text-catalyst-grey-600 hover:text-blue-400 transition-colors" aria-label="Text">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                  </a>
                </div>
              </div>

              {/* Row 2+: secondary fields, wrap as needed */}
              <div className="pl-10 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-catalyst-grey-400">
                {c.email && (
                  <span className="inline-flex items-center gap-1 max-w-full truncate" title={c.email}>
                    <span className="text-catalyst-grey-600">✉</span>{c.email}
                  </span>
                )}
                {c.phone && (
                  <span className="whitespace-nowrap">{formatPhone(c.phone)}</span>
                )}
                {c.service && (
                  <span className="max-w-full truncate" title={c.service}>{c.service}</span>
                )}
                {c.vehicle && (
                  <span className="max-w-full truncate" title={c.vehicle}>{c.vehicle}</span>
                )}
                <span className="text-catalyst-grey-600 whitespace-nowrap">{formatShortDate(c.created_at)}</span>
                <span className="ml-auto" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={c.assigned_agent_id || ""}
                    onChange={(e) => assignAgent(c.id, e.target.value ? Number(e.target.value) : null)}
                    className="rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-xs text-catalyst-grey-400 focus:outline-none appearance-none max-w-[120px]"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </span>
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {showNew && (
        <NewContactModal
          onClose={() => setShowNew(false)}
          onCreated={(c) => {
            setContacts((prev) => [c, ...prev]);
            setShowNew(false);
            router.push(`/admin/crm/contacts/${c.id}`);
          }}
        />
      )}
    </div>
  );
}

function NewContactModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Contact) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [label, setLabel] = useState<string>("lead");
  const [contactTag, setContactTag] = useState<string>("");
  const [contactStatus, setContactStatus] = useState<string>("new");
  const [source, setSource] = useState("manual");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service: service.trim(),
        vehicle: vehicle.trim(),
        message: notes.trim(),
        label,
        contact_status: contactStatus,
        source: source.trim() || "manual",
      };
      if (contactTag) payload.contact_tag = contactTag;
      if (estimatedValue) {
        const n = Number(estimatedValue);
        if (!Number.isNaN(n)) payload.estimated_value = n;
      }
      const res = await fetch("/api/admin/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error || "Failed to create contact");
        setSaving(false);
        return;
      }
      onCreated(body.quote);
    } catch {
      setError("Network error");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-catalyst-border bg-catalyst-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-catalyst-border px-5 py-4">
            <h2 className="font-heading text-lg font-semibold text-white">New Contact</h2>
            <button type="button" onClick={onClose} className="text-catalyst-grey-500 hover:text-white" aria-label="Close">✕</button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-3">
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Service</label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Vehicle</label>
                <input
                  type="text"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Label</label>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none"
                >
                  <option value="lead">Lead</option>
                  <option value="contact">Contact</option>
                  <option value="client">Client</option>
                  <option value="past client">Past Client</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Status</label>
                <select
                  value={contactStatus}
                  onChange={(e) => setContactStatus(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none"
                >
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Tag</label>
                <select
                  value={contactTag}
                  onChange={(e) => setContactTag(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none"
                >
                  <option value="">None</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="!">! Needs Attention</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Source</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="manual, referral, website..."
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Estimated Value ($)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-catalyst-grey-400 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-catalyst-border px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-sm text-catalyst-grey-300 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-catalyst-red px-4 py-2 text-sm font-medium text-white hover:bg-catalyst-red/90 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
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
