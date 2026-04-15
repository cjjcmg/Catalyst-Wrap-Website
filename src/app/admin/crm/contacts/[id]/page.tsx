"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface Quote {
  id: number;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  message: string;
  contact_tag: string | null;
  contact_status: string | null;
  assigned_agent_id: number | null;
  estimated_value: number | null;
  last_contact_date: string | null;
  source: string | null;
  street: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

interface Activity {
  id: number;
  activity_type: string;
  subject: string | null;
  body: string | null;
  created_at: string;
  users?: { name: string } | null;
}

interface Note {
  id: number;
  content: string;
  created_at: string;
  created_by_name?: string;
}

interface Reminder {
  id: number;
  reminder_date: string;
  reminder_type: string;
  message: string | null;
  is_completed: boolean;
  users?: { name: string } | null;
}

interface Appointment {
  id: number;
  title: string | null;
  date_time: string;
  end_time: string | null;
  status: string;
  details: string | null;
}

const STATUSES = ["new", "contacted", "quoted", "scheduled", "in_progress", "completed", "client", "past_client", "lost"];
const STATUS_LABELS: Record<string, string> = { new: "New", contacted: "Contacted", quoted: "Quoted", scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed", client: "Client", past_client: "Past Client", lost: "Lost" };
const STATUS_COLORS: Record<string, string> = { new: "bg-blue-500", contacted: "bg-cyan-500", quoted: "bg-purple-500", scheduled: "bg-amber-500", in_progress: "bg-orange-500", completed: "bg-green-500", client: "bg-emerald-500", past_client: "bg-catalyst-grey-500", lost: "bg-red-500" };
const TAG_COLORS: Record<string, string> = { A: "bg-green-500 text-white", B: "bg-amber-500 text-black", C: "bg-red-500 text-white", "!": "bg-violet-500 text-white" };
const US_STATES = ["CA","AL","AK","AZ","AR","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const ACTIVITY_TYPES = ["call", "email", "text", "meeting", "note", "quote_sent", "follow_up"];
const ACTIVITY_ICONS: Record<string, string> = { call: "📞", email: "📧", text: "💬", meeting: "🤝", note: "📝", quote_sent: "📋", follow_up: "🔄" };

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function formatDate(d: string) {
  return new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function CRMContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Number(params.id);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity form
  const [actType, setActType] = useState("call");
  const [actSubject, setActSubject] = useState("");
  const [actBody, setActBody] = useState("");
  const [savingAct, setSavingAct] = useState(false);

  // Reminder form
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [remDate, setRemDate] = useState("");
  const [remMessage, setRemMessage] = useState("");
  const [savingRem, setSavingRem] = useState(false);

  // Edit contact
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", service: "", vehicle: "", message: "", street: "", street2: "", city: "", state: "CA", zip: "" });
  const [saving, setSaving] = useState(false);

  // Estimated value
  const [editingValue, setEditingValue] = useState(false);
  const [estValue, setEstValue] = useState("");

  useEffect(() => {
    async function load() {
      const [qRes, actRes, noteRes, remRes, apptRes] = await Promise.all([
        fetch(`/api/admin/quotes?id=${quoteId}`),
        fetch(`/api/admin/crm/activities?quote_id=${quoteId}`),
        fetch(`/api/admin/notes?quote_id=${quoteId}`),
        fetch(`/api/admin/crm/reminders?filter=all&quote_id=${quoteId}`),
        fetch(`/api/admin/appointments?quote_id=${quoteId}`),
      ]);
      const [qData, actData, noteData, remData, apptData] = await Promise.all([
        qRes.json(), actRes.json(), noteRes.json(), remRes.json(), apptRes.json(),
      ]);
      const q = qData.quote || null;
      setQuote(q);
      setEstValue(q?.estimated_value?.toString() || "");
      if (q) setEditForm({ name: q.name, email: q.email, phone: q.phone, service: q.service || "", vehicle: q.vehicle || "", message: q.message || "", street: q.street || "", street2: q.street2 || "", city: q.city || "", state: q.state || "CA", zip: q.zip || "" });
      setActivities(actData.activities || []);
      setNotes(noteData.notes || []);
      setReminders(remData.reminders || []);
      setAppointments(apptData.appointments || []);
      setLoading(false);
    }
    load();
  }, [quoteId]);

  async function updateField(field: string, value: unknown) {
    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quoteId, [field]: value }),
    });
    if (res.ok) {
      const { quote: updated } = await res.json();
      setQuote(updated);
    }
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quoteId, ...editForm }),
    });
    if (res.ok) {
      const { quote: updated } = await res.json();
      setQuote(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function logActivity() {
    if (!actSubject.trim()) return;
    setSavingAct(true);
    const res = await fetch("/api/admin/crm/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId, activity_type: actType, subject: actSubject, body: actBody }),
    });
    if (res.ok) {
      const { activity } = await res.json();
      setActivities((prev) => [activity, ...prev]);
      setActSubject("");
      setActBody("");
    }
    setSavingAct(false);
  }

  async function addReminder() {
    if (!remDate) return;
    setSavingRem(true);
    const res = await fetch("/api/admin/crm/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId, reminder_date: new Date(remDate).toISOString(), message: remMessage }),
    });
    if (res.ok) {
      const { reminder } = await res.json();
      setReminders((prev) => [reminder, ...prev]);
      setShowReminderForm(false);
      setRemDate("");
      setRemMessage("");
    }
    setSavingRem(false);
  }

  async function completeReminder(id: number) {
    const res = await fetch("/api/admin/crm/reminders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_completed: true } : r)));
    }
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-6"><p className="text-catalyst-grey-500">Loading...</p></div>;
  if (!quote) return <div className="max-w-5xl mx-auto px-4 py-6"><p className="text-catalyst-grey-500">Contact not found.</p></div>;

  // Merge activities + notes into timeline
  const timeline = [
    ...activities.map((a) => ({ ...a, _type: "activity" as const, _date: a.created_at })),
    ...notes.map((n) => ({ ...n, _type: "note" as const, _date: n.created_at })),
  ].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime());

  const activeReminders = reminders.filter((r) => !r.is_completed);
  const scheduledAppts = appointments.filter((a) => a.status === "scheduled");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/admin/crm/contacts")} className="text-catalyst-grey-500 hover:text-white transition-colors flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><polyline points="12 19 5 12 12 5" /></svg>
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white truncate">{quote.name}</h1>

          {/* Tag buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {(["A", "B", "C", "!"] as const).map((t) => (
              <button
                key={t}
                onClick={() => updateField("contact_tag", quote.contact_tag === t ? null : t)}
                className={`w-7 h-7 rounded-full text-xs font-bold ${
                  quote.contact_tag === t ? TAG_COLORS[t] : "bg-catalyst-border text-catalyst-grey-600 hover:text-white"
                } transition-colors`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={`tel:${quote.phone}`} className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-green-400 hover:bg-green-500/10 transition-colors">Call</a>
          <a href={`sms:${quote.phone}`} className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors">Text</a>
          <a href={`mailto:${quote.email}`} className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-500/10 transition-colors">Email</a>
        </div>
      </div>

      {/* Status pipeline bar */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
        <div className="flex rounded-lg overflow-hidden">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateField("contact_status", s)}
              className={`flex-1 py-2 text-xs font-medium text-center transition-colors ${
                quote.contact_status === s
                  ? `${STATUS_COLORS[s]} text-white`
                  : "bg-catalyst-black text-catalyst-grey-500 hover:text-white hover:bg-white/5"
              } ${s !== "lost" ? "border-r border-catalyst-border/50" : ""}`}
            >
              <span className="hidden sm:inline">{STATUS_LABELS[s]}</span>
              <span className="sm:hidden">{STATUS_LABELS[s].slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Contact info + Activity timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-white">Contact Info</h2>
              {!editing && (
                <button
                  onClick={() => { setEditing(true); setEditForm({ name: quote.name, email: quote.email, phone: quote.phone, service: quote.service || "", vehicle: quote.vehicle || "", message: quote.message || "", street: quote.street || "", street2: quote.street2 || "", city: quote.city || "", state: quote.state || "CA", zip: quote.zip || "" }); }}
                  className="flex items-center gap-1.5 rounded-lg bg-catalyst-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-3">
                {([
                  { label: "Name", key: "name", type: "text" },
                  { label: "Email", key: "email", type: "email" },
                  { label: "Phone", key: "phone", type: "tel" },
                  { label: "Service", key: "service", type: "text" },
                  { label: "Vehicle", key: "vehicle", type: "text" },
                ] as const).map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">{label}</label>
                    <input
                      type={type}
                      value={editForm[key]}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Street</label>
                  <input type="text" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Street 2</label>
                  <input type="text" value={editForm.street2} onChange={(e) => setEditForm({ ...editForm, street2: e.target.value })} placeholder="Apt, Suite, Unit" className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">City</label>
                    <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">State</label>
                    <select value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none appearance-none">
                      {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Zip</label>
                    <input type="text" value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} maxLength={10} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Message</label>
                  <textarea
                    rows={3}
                    value={editForm.message}
                    onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                    className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:border-catalyst-red focus:outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditing(false)} className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-catalyst-grey-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={saveEdit} disabled={saving} className="rounded-lg bg-catalyst-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Email</p>
                  <a href={`mailto:${quote.email}`} className="text-catalyst-red hover:underline">{quote.email}</a>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Phone</p>
                  <a href={`tel:${quote.phone}`} className="text-catalyst-red hover:underline">{formatPhone(quote.phone)}</a>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Service</p>
                  <p className="text-white">{quote.service || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Vehicle</p>
                  <p className="text-white">{quote.vehicle || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Estimated Value</p>
                  {editingValue ? (
                    <div className="flex items-center gap-2">
                      <input type="number" value={estValue} onChange={(e) => setEstValue(e.target.value)} className="w-24 rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-white text-sm focus:outline-none" />
                      <button onClick={() => { updateField("estimated_value", estValue ? Number(estValue) : null); setEditingValue(false); }} className="text-xs text-green-400">Save</button>
                      <button onClick={() => setEditingValue(false)} className="text-xs text-catalyst-grey-500">Cancel</button>
                    </div>
                  ) : (
                    <p className="text-white cursor-pointer hover:text-catalyst-red" onClick={() => setEditingValue(true)}>
                      {quote.estimated_value ? `$${quote.estimated_value.toLocaleString()}` : "—"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Source</p>
                  <p className="text-white">{quote.source || "Website"}</p>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Created</p>
                  <p className="text-white">{formatDate(quote.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Last Contact</p>
                  <p className="text-white">{quote.last_contact_date ? formatDate(quote.last_contact_date) : "—"}</p>
                </div>
                {(quote.street || quote.city || quote.state || quote.zip) && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Address</p>
                    <p className="text-white">
                      {quote.street}{quote.street2 ? `, ${quote.street2}` : ""}
                      {(quote.street || quote.street2) && <br />}
                      {[quote.city, quote.state].filter(Boolean).join(", ")}{quote.zip ? ` ${quote.zip}` : ""}
                    </p>
                  </div>
                )}
                {quote.message && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider">Message</p>
                    <p className="text-catalyst-grey-300">{quote.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Log Activity */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
            <h2 className="font-heading text-lg font-semibold text-white">Log Activity</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <select value={actType} onChange={(e) => setActType(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white focus:outline-none appearance-none">
                  {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{ACTIVITY_ICONS[t]} {t}</option>)}
                </select>
                <input type="text" placeholder="Subject" value={actSubject} onChange={(e) => setActSubject(e.target.value)} className="flex-1 rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:outline-none" />
              </div>
              <textarea rows={2} placeholder="Details (optional)" value={actBody} onChange={(e) => setActBody(e.target.value)} className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-2 text-sm text-white placeholder-catalyst-grey-600 focus:outline-none resize-none" />
              <div className="flex justify-end">
                <button onClick={logActivity} disabled={savingAct || !actSubject.trim()} className="rounded-lg bg-catalyst-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50">
                  {savingAct ? "Logging..." : "Log Activity"}
                </button>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
            <h2 className="font-heading text-lg font-semibold text-white">Timeline ({timeline.length})</h2>
            {timeline.length === 0 ? (
              <p className="text-catalyst-grey-500 text-sm">No activity yet.</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((item) => (
                  <div key={`${item._type}-${item.id}`} className="flex gap-3 py-2 border-b border-catalyst-border/30 last:border-0">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {item._type === "activity" ? ACTIVITY_ICONS[(item as Activity).activity_type] || "📌" : "📝"}
                    </span>
                    <div className="min-w-0 flex-1">
                      {item._type === "activity" ? (
                        <>
                          <p className="text-sm text-white">
                            <span className="font-medium">{(item as Activity).activity_type}</span>
                            {(item as Activity).subject && <> — {(item as Activity).subject}</>}
                          </p>
                          {(item as Activity).body && <p className="text-xs text-catalyst-grey-400 mt-0.5 whitespace-pre-wrap">{(item as Activity).body}</p>}
                          <p className="text-xs text-catalyst-grey-600 mt-1">
                            {(item as Activity).users?.name || "Unknown"} · {formatDate(item._date)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-catalyst-grey-300 whitespace-pre-wrap">{(item as Note).content}</p>
                          <p className="text-xs text-catalyst-grey-600 mt-1">
                            {(item as Note).created_by_name || "Unknown"} · {formatDate(item._date)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Reminders + Appointments */}
        <div className="space-y-6">
          {/* Reminders */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-white">Reminders</h2>
              <button onClick={() => setShowReminderForm(!showReminderForm)} className="text-xs text-catalyst-grey-500 hover:text-white transition-colors">
                {showReminderForm ? "Cancel" : "+ Add"}
              </button>
            </div>

            {showReminderForm && (
              <div className="space-y-2 rounded-lg border border-catalyst-border bg-catalyst-black p-3">
                <input type="datetime-local" value={remDate} onChange={(e) => setRemDate(e.target.value)} className="w-full rounded border border-catalyst-border bg-catalyst-dark px-3 py-1.5 text-sm text-white focus:outline-none [color-scheme:dark]" />
                <input type="text" placeholder="Message" value={remMessage} onChange={(e) => setRemMessage(e.target.value)} className="w-full rounded border border-catalyst-border bg-catalyst-dark px-3 py-1.5 text-sm text-white placeholder-catalyst-grey-600 focus:outline-none" />
                <button onClick={addReminder} disabled={savingRem || !remDate} className="w-full rounded bg-catalyst-red py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {savingRem ? "Adding..." : "Add Reminder"}
                </button>
              </div>
            )}

            {activeReminders.length === 0 && !showReminderForm ? (
              <p className="text-catalyst-grey-500 text-sm">No active reminders.</p>
            ) : (
              <div className="space-y-2">
                {activeReminders.map((r) => {
                  const isOverdue = new Date(r.reminder_date) < new Date();
                  return (
                    <div key={r.id} className={`rounded-lg border p-3 ${isOverdue ? "border-red-500/30 bg-red-500/5" : "border-catalyst-border/50 bg-catalyst-black"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-xs font-medium ${isOverdue ? "text-red-400" : "text-catalyst-grey-300"}`}>
                            {formatDate(r.reminder_date)}
                          </p>
                          {r.message && <p className="text-sm text-white mt-0.5">{r.message}</p>}
                        </div>
                        <button onClick={() => completeReminder(r.id)} className="text-xs text-catalyst-grey-500 hover:text-green-400 flex-shrink-0">Done</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-white">Appointments</h2>
              <button onClick={() => router.push(`/admin/contact/${quoteId}`)} className="text-xs text-catalyst-grey-500 hover:text-white transition-colors">Manage</button>
            </div>
            {scheduledAppts.length === 0 ? (
              <p className="text-catalyst-grey-500 text-sm">No upcoming appointments.</p>
            ) : (
              <div className="space-y-2">
                {scheduledAppts.map((a) => (
                  <div key={a.id} className="rounded-lg border border-catalyst-border/50 bg-catalyst-black p-3">
                    {a.title && <p className="text-sm text-white font-medium">{a.title}</p>}
                    <p className="text-xs text-catalyst-grey-300">
                      {formatDate(a.date_time)}
                      {a.end_time && <> — {new Date(a.end_time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</>}
                    </p>
                    {a.details && <p className="text-xs text-catalyst-grey-500 mt-0.5">{a.details}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
