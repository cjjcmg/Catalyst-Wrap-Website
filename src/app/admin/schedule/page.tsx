"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Contact {
  id: number;
  name: string;
  email: string;
  service: string;
}

const ALL_TIMES = Array.from({ length: 24 * 4 }, (_, i) => {
  const h = Math.floor(i / 4);
  const m = (i % 4) * 15;
  const val = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  const label = `${hour12}:${String(m).padStart(2, "0")} ${ampm}`;
  return { val, label, hour12, h };
});

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = search
    ? ALL_TIMES.filter((t) => {
        const num = search.replace(/[^0-9]/g, "");
        if (!num) return true;
        return String(t.hour12).startsWith(num) || String(t.h).startsWith(num);
      })
    : ALL_TIMES;

  const selectedLabel = ALL_TIMES.find((t) => t.val === value)?.label || "";

  return (
    <div className="relative">
      <input
        type="text"
        value={open ? search : selectedLabel}
        placeholder="Select time"
        onChange={(e) => { setSearch(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setSearch(""); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        className="w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-catalyst-border bg-catalyst-dark shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-4 py-2 text-sm text-catalyst-grey-500">No matches</p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.val}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(t.val); setOpen(false); setSearch(""); }}
                className={`block w-full text-left px-4 py-1.5 text-sm hover:bg-white/5 ${
                  t.val === value ? "text-catalyst-red" : "text-white"
                }`}
              >
                {t.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [details, setDetails] = useState("");
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((d) => setContacts((d.quotes || []).map((q: Contact) => ({ id: q.id, name: q.name, email: q.email, service: q.service }))));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContact || !date || !time) return;
    setSaving(true);

    const dateTime = new Date(`${date}T${time}`).toISOString();
    const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`).toISOString() : null;

    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_id: Number(selectedContact),
        title,
        date_time: dateTime,
        end_time: endDateTime,
        details,
        share_with_contact: share,
      }),
    });

    if (res.ok) {
      router.push("/admin");
    }
    setSaving(false);
  }

  const selectedEmail = contacts.find((c) => c.id === Number(selectedContact))?.email;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">New Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-1">Contact</label>
          <select
            value={selectedContact}
            onChange={(e) => setSelectedContact(e.target.value)}
            required
            className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none appearance-none"
          >
            <option value="" disabled>Select a contact</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-1">Title</label>
          <input
            type="text"
            placeholder="e.g. Vinyl Wrap Consultation"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
          />
        </div>

        <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider pt-1">Start</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-catalyst-grey-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); if (!endDate) setEndDate(e.target.value); }} required className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-xs text-catalyst-grey-400 mb-1">Time</label>
            <TimeSelect value={time} onChange={setTime} />
          </div>
        </div>

        <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider pt-1">End</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-catalyst-grey-400 mb-1">Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none [color-scheme:dark]" />
          </div>
          <div>
            <label className="block text-xs text-catalyst-grey-400 mb-1">Time</label>
            <TimeSelect value={endTime} onChange={setEndTime} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-1">Notes</label>
          <textarea rows={3} placeholder="Additional notes..." value={details} onChange={(e) => setDetails(e.target.value)} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none resize-none" />
        </div>

        {selectedEmail && (
          <div className="flex items-center gap-2">
            <input type="checkbox" id="schedule_share" checked={share} onChange={(e) => setShare(e.target.checked)} className="accent-catalyst-red" />
            <label htmlFor="schedule_share" className="text-sm text-catalyst-grey-400">Share with contact ({selectedEmail})</label>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.push("/admin")} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-catalyst-grey-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving || !selectedContact || !date || !time} className="rounded-lg bg-catalyst-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50">
            {saving ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </form>
    </div>
  );
}
