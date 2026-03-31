"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
}

export default function AdminDashboard() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email);
        setSavedEmail(d.email);
      });

    fetch("/api/admin/quotes")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d.quotes || []);
        setLoading(false);
      });
  }, []);

  async function saveEmail() {
    setEmailStatus("Saving...");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setSavedEmail(email);
      setEmailStatus("Saved");
    } else {
      setEmailStatus("Error saving");
    }
    setTimeout(() => setEmailStatus(""), 2000);
  }

  async function deleteQuote(id: number) {
    if (!confirm("Delete this lead?")) return;
    const res = await fetch("/api/admin/quotes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  async function saveQuote() {
    if (!editingQuote) return;
    setSaving(true);
    const { id, name, email: qEmail, phone, service, vehicle, message, text_updates } = editingQuote;
    const res = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, email: qEmail, phone, service, vehicle, message, text_updates }),
    });
    if (res.ok) {
      const { quote } = await res.json();
      setQuotes((prev) => prev.map((q) => (q.id === quote.id ? quote : q)));
      setEditingQuote(null);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold text-white">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-catalyst-grey-500 hover:text-white transition-colors"
        >
          Log Out
        </button>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-white">Settings</h2>
        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-2">Notification Email</label>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
            />
            <button
              onClick={saveEmail}
              disabled={email === savedEmail}
              className="rounded-lg bg-catalyst-red px-5 py-2 font-heading text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-30"
            >
              Save
            </button>
          </div>
          {emailStatus && (
            <p className="mt-2 text-sm text-catalyst-grey-400">{emailStatus}</p>
          )}
        </div>
      </div>

      {/* Quotes */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 space-y-4">
        <h2 className="font-heading text-xl font-semibold text-white">
          Quote Submissions ({quotes.length})
        </h2>

        {loading ? (
          <p className="text-catalyst-grey-500">Loading...</p>
        ) : quotes.length === 0 ? (
          <p className="text-catalyst-grey-500">No quotes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-catalyst-border text-left text-catalyst-grey-400">
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Vehicle</th>
                  <th className="pb-3 pr-4 font-medium">Message</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-catalyst-border/50 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => setEditingQuote({ ...q })}
                  >
                    <td className="py-3 pr-4 text-catalyst-grey-400 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-white whitespace-nowrap">{q.name}</td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 max-w-[180px] truncate" title={q.email}>
                      {q.email}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 whitespace-nowrap" title={q.phone}>
                      {q.phone}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 max-w-[120px] truncate" title={q.service}>
                      {q.service}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 max-w-[160px] truncate" title={q.vehicle}>
                      {q.vehicle}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-400 max-w-[200px] truncate" title={q.message}>
                      {q.message}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteQuote(q.id);
                        }}
                        className="text-catalyst-grey-600 hover:text-red-500 transition-colors"
                        title="Delete lead"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setEditingQuote(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-catalyst-border bg-catalyst-card p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-xl font-semibold text-white">Edit Lead</h3>
              <button
                onClick={() => setEditingQuote(null)}
                className="text-catalyst-grey-500 hover:text-white transition-colors text-xl leading-none"
              >
                &times;
              </button>
            </div>

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
                    value={editingQuote[key]}
                    onChange={(e) =>
                      setEditingQuote({ ...editingQuote, [key]: e.target.value })
                    }
                    className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-catalyst-grey-400 mb-1">Message</label>
                <textarea
                  rows={3}
                  value={editingQuote.message}
                  onChange={(e) =>
                    setEditingQuote({ ...editingQuote, message: e.target.value })
                  }
                  className="w-full rounded-lg border border-catalyst-border bg-catalyst-black px-4 py-2 text-white focus:border-catalyst-red focus:outline-none resize-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="text_updates"
                  checked={editingQuote.text_updates}
                  onChange={(e) =>
                    setEditingQuote({ ...editingQuote, text_updates: e.target.checked })
                  }
                  className="accent-catalyst-red"
                />
                <label htmlFor="text_updates" className="text-sm text-catalyst-grey-400">
                  Text Updates
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingQuote(null)}
                className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-catalyst-grey-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveQuote}
                disabled={saving}
                className="rounded-lg bg-catalyst-red px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
