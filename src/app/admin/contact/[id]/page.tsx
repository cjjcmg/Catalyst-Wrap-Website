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
  text_updates: boolean;
  archived: boolean;
}

interface Note {
  id: number;
  quote_id: number;
  content: string;
  created_at: string;
  created_by?: string;
  created_by_name?: string;
}

interface Appointment {
  id: number;
  quote_id: number;
  date_time: string;
  details: string | null;
  status: "scheduled" | "cancelled";
  share_with_contact: boolean;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
  cancelled_at?: string;
  cancelled_by?: string;
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = Number(params.id);

  const [quote, setQuote] = useState<Quote | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showApptForm, setShowApptForm] = useState(false);
  const [apptDate, setApptDate] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [apptDetails, setApptDetails] = useState("");
  const [apptShare, setApptShare] = useState(false);
  const [savingAppt, setSavingAppt] = useState(false);

  useEffect(() => {
    async function load() {
      const [qRes, nRes, aRes] = await Promise.all([
        fetch(`/api/admin/quotes?id=${quoteId}`),
        fetch(`/api/admin/notes?quote_id=${quoteId}`),
        fetch(`/api/admin/appointments?quote_id=${quoteId}`),
      ]);
      const qData = await qRes.json();
      const nData = await nRes.json();
      const aData = await aRes.json();

      setQuote(qData.quote || null);
      setEditForm(qData.quote || null);
      setNotes(nData.notes || []);
      setAppointments(aData.appointments || []);
      setLoading(false);
    }
    load();
  }, [quoteId]);

  async function saveEdit() {
    if (!editForm) return;
    setSaving(true);
    const { id, name, email, phone, service, vehicle, message, text_updates } = editForm;
    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, email, phone, service, vehicle, message, text_updates }),
    });
    if (res.ok) {
      const { quote: updated } = await res.json();
      setQuote(updated);
      setEditForm(updated);
      setEditing(false);
    }
    setSaving(false);
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    const res = await fetch("/api/admin/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote_id: quoteId, content: newNote }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
      setShowNoteInput(false);
    }
    setAddingNote(false);
  }

  async function toggleArchive() {
    if (!quote) return;
    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: quote.id, archived: !quote.archived }),
    });
    if (res.ok) {
      const { quote: updated } = await res.json();
      setQuote(updated);
      setEditForm(updated);
    }
  }

  async function createAppointment() {
    if (!apptDate || !apptTime) return;
    setSavingAppt(true);
    const dateTime = new Date(`${apptDate}T${apptTime}`).toISOString();
    const res = await fetch("/api/admin/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quote_id: quoteId,
        date_time: dateTime,
        details: apptDetails,
        share_with_contact: apptShare,
      }),
    });
    if (res.ok) {
      const { appointment } = await res.json();
      setAppointments((prev) => [appointment, ...prev]);
      setShowApptForm(false);
      setApptDate("");
      setApptTime("");
      setApptDetails("");
      setApptShare(false);
    }
    setSavingAppt(false);
  }

  async function cancelAppointment(id: number) {
    if (!confirm("Cancel this appointment?")) return;
    const res = await fetch("/api/admin/appointments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    if (res.ok) {
      const { appointment } = await res.json();
      setAppointments((prev) => prev.map((a) => (a.id === id ? appointment : a)));
    }
  }

  async function deleteNote(noteId: number) {
    if (!confirm("Delete this note?")) return;
    const res = await fetch("/api/admin/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: noteId }),
    });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p className="text-catalyst-grey-500">Loading...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        <p className="text-catalyst-grey-500">Contact not found.</p>
        <button
          onClick={() => router.push("/admin")}
          className="text-sm text-catalyst-red hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const serviceLabels: Record<string, string> = {
    "vinyl-wrap": "Vinyl Wraps",
    ppf: "Paint Protection Film (PPF)",
    "window-tint": "Window Tint",
    customization: "Off-Road & Luxury Customization",
    other: "Other / Not Sure",
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(quote.archived ? "/admin/archived" : "/admin")}
            className="text-catalyst-grey-500 hover:text-white transition-colors flex-shrink-0"
            title="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white truncate">{quote.name}</h1>
          {quote.archived && (
            <span className="flex-shrink-0 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-400">
              Archived
            </span>
          )}
        </div>
        <button
          onClick={toggleArchive}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors flex-shrink-0 ${
            quote.archived
              ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
              : "border-catalyst-border text-catalyst-grey-400 hover:text-amber-400 hover:border-amber-500/30"
          }`}
        >
          {quote.archived ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Restore
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archive
            </>
          )}
        </button>
      </div>

      {/* Contact Info Card */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">Contact Information</h2>
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setShowNoteInput(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-catalyst-grey-400 hover:text-white hover:border-catalyst-grey-600 transition-colors"
                  title="Add Note"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Note
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-catalyst-red px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              </>
            )}
          </div>
        </div>

        {editing && editForm ? (
          <div className="space-y-4">
            {([
              { label: "Name", key: "name", type: "text" },
              { label: "Email", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Service", key: "service", type: "text" },
              { label: "Vehicle", key: "vehicle", type: "text" },
            ] as const).map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-sm text-catalyst-grey-400 mb-1">{label}</label>
                <input
                  type={type}
                  value={editForm[key]}
                  onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="block text-sm text-catalyst-grey-400 mb-1">Message</label>
              <textarea
                rows={3}
                value={editForm.message}
                onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_text_updates"
                checked={editForm.text_updates}
                onChange={(e) => setEditForm({ ...editForm, text_updates: e.target.checked })}
                className="accent-catalyst-red"
              />
              <label htmlFor="edit_text_updates" className="text-sm text-catalyst-grey-400">
                Text Updates
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setEditing(false);
                  setEditForm(quote);
                }}
                className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="rounded-lg bg-catalyst-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Date Submitted</p>
              <p className="text-white">{formatDate(quote.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-white">{quote.name}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Email</p>
              <a href={`mailto:${quote.email}`} className="text-catalyst-red hover:underline">
                {quote.email}
              </a>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Phone</p>
              <a href={`tel:${quote.phone}`} className="text-catalyst-red hover:underline">
                {formatPhone(quote.phone)}
              </a>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Service</p>
              <p className="text-white">{serviceLabels[quote.service] || quote.service}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Vehicle</p>
              <p className="text-white">{quote.vehicle || "—"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Message</p>
              <p className="text-catalyst-grey-300">{quote.message || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Text Updates</p>
              <p className="text-white">{quote.text_updates ? "Yes" : "No"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Appointments Section */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">
            Appointments ({appointments.filter((a) => a.status === "scheduled").length})
          </h2>
          {!showApptForm && (
            <button
              onClick={() => setShowApptForm(true)}
              className="flex items-center gap-1.5 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Schedule
            </button>
          )}
        </div>

        {/* New Appointment Form */}
        {showApptForm && (
          <div className="space-y-3 rounded-lg border border-catalyst-border bg-catalyst-black p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-catalyst-grey-400 mb-1">Date</label>
                <input
                  type="date"
                  value={apptDate}
                  onChange={(e) => setApptDate(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-2 text-white focus:border-catalyst-red focus:outline-none [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-catalyst-grey-400 mb-1">Time</label>
                <input
                  type="time"
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-2 text-white focus:border-catalyst-red focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-catalyst-grey-400 mb-1">Details</label>
              <textarea
                rows={2}
                placeholder="Appointment details..."
                value={apptDetails}
                onChange={(e) => setApptDetails(e.target.value)}
                className="w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="share_appt"
                checked={apptShare}
                onChange={(e) => setApptShare(e.target.checked)}
                className="accent-catalyst-red"
              />
              <label htmlFor="share_appt" className="text-sm text-catalyst-grey-400">
                Share with contact ({quote.email})
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowApptForm(false);
                  setApptDate("");
                  setApptTime("");
                  setApptDetails("");
                  setApptShare(false);
                }}
                className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createAppointment}
                disabled={savingAppt || !apptDate || !apptTime}
                className="rounded-lg bg-catalyst-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {savingAppt ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {appointments.length === 0 && !showApptForm ? (
          <p className="text-catalyst-grey-500 text-sm">No appointments yet.</p>
        ) : (
          <div className="space-y-3">
            {appointments.map((appt) => (
              <div
                key={appt.id}
                className={`rounded-lg border p-4 ${
                  appt.status === "cancelled"
                    ? "border-catalyst-border/30 bg-catalyst-black/50"
                    : "border-catalyst-border/50 bg-catalyst-black"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium ${appt.status === "cancelled" ? "text-catalyst-grey-500 line-through" : "text-white"}`}>
                        {new Date(appt.date_time).toLocaleString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </p>
                      {appt.status === "cancelled" && (
                        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                          Cancelled
                        </span>
                      )}
                      {appt.status === "scheduled" && appt.share_with_contact && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-400">
                          Shared
                        </span>
                      )}
                    </div>
                    {appt.details && (
                      <p className={`text-sm mt-1 ${appt.status === "cancelled" ? "text-catalyst-grey-600" : "text-catalyst-grey-300"}`}>
                        {appt.details}
                      </p>
                    )}
                    <p className="text-catalyst-grey-600 text-xs mt-2">
                      {appt.created_by_name || appt.created_by?.split("@")[0] || "Unknown"} &middot; {formatDate(appt.created_at)}
                      {appt.status === "cancelled" && appt.cancelled_by && (
                        <> &middot; Cancelled by {appt.cancelled_by.split("@")[0]}</>
                      )}
                    </p>
                  </div>
                  {appt.status === "scheduled" && (
                    <button
                      onClick={() => cancelAppointment(appt.id)}
                      className="text-catalyst-grey-600 hover:text-red-500 transition-colors flex-shrink-0 text-xs"
                      title="Cancel appointment"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-white">
            Notes ({notes.length})
          </h2>
          {!showNoteInput && (
            <button
              onClick={() => setShowNoteInput(true)}
              className="flex items-center gap-1.5 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Note
            </button>
          )}
        </div>

        {/* Add Note Input */}
        {showNoteInput && (
          <div className="space-y-3 rounded-lg border border-catalyst-border bg-catalyst-black p-4">
            <textarea
              rows={3}
              placeholder="Write a note..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="w-full rounded-lg border border-catalyst-border bg-catalyst-dark px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowNoteInput(false);
                  setNewNote("");
                }}
                className="rounded-lg border border-catalyst-border px-3 py-1.5 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addNote}
                disabled={addingNote || !newNote.trim()}
                className="rounded-lg bg-catalyst-red px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {addingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {notes.length === 0 && !showNoteInput ? (
          <p className="text-catalyst-grey-500 text-sm">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group rounded-lg border border-catalyst-border/50 bg-catalyst-black p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-catalyst-grey-300 text-sm whitespace-pre-wrap">{note.content}</p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-catalyst-grey-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                    title="Delete note"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
                <p className="text-catalyst-grey-600 text-xs mt-2">
                  {note.created_by_name || note.created_by?.split("@")[0] || "Unknown"} &middot; {formatDate(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
