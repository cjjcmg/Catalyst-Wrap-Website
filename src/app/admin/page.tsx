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
                  <th className="pb-3 font-medium">Message</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} className="border-b border-catalyst-border/50">
                    <td className="py-3 pr-4 text-catalyst-grey-400 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-white whitespace-nowrap">{q.name}</td>
                    <td className="py-3 pr-4 text-catalyst-grey-300">
                      <a href={`mailto:${q.email}`} className="hover:text-white transition-colors">
                        {q.email}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 whitespace-nowrap">
                      <a href={`tel:${q.phone}`} className="hover:text-white transition-colors">
                        {q.phone}
                      </a>
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300">{q.service}</td>
                    <td className="py-3 pr-4 text-catalyst-grey-300">{q.vehicle}</td>
                    <td className="py-3 text-catalyst-grey-400 max-w-[200px] truncate">
                      {q.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
