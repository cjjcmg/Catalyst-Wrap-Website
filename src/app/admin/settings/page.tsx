"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
  id: number;
}

interface TeamUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  disabled: boolean;
  created_at: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "user">("user");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null));

    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setEmail(d.email);
        setSavedEmail(d.email);
      });
  }, []);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchTeamUsers();
    }
  }, [user]);

  async function fetchTeamUsers() {
    setTeamLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      const d = await res.json();
      setTeamUsers(d.users || []);
    }
    setTeamLoading(false);
  }

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

  function startEdit(tu: TeamUser) {
    setEditingId(tu.id);
    setEditName(tu.name);
    setEditEmail(tu.email);
    setEditRole(tu.role);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editName, email: editEmail, role: editRole }),
    });
    if (res.ok) {
      setEditingId(null);
      fetchTeamUsers();
    }
  }

  async function toggleDisabled(tu: TeamUser) {
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: tu.id, disabled: !tu.disabled }),
    });
    if (res.ok) {
      fetchTeamUsers();
    }
  }

  async function deleteUser(id: number) {
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setDeletingId(null);
      fetchTeamUsers();
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Settings</h1>
      </div>

      {/* Notification Email */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Notifications</h2>
        <div>
          <label className="block text-sm text-catalyst-grey-400 mb-1">Notification Email</label>
          <p className="text-xs text-catalyst-grey-500 mb-2">New quote submissions will be sent to this email address.</p>
          <div className="flex flex-col sm:flex-row gap-3">
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

      {/* Mailchimp Sync */}
      {user?.role === "admin" && (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-white">Mailchimp</h2>
          <p className="text-sm text-catalyst-grey-400">
            Sync all contacts with the &quot;Catalyst Motorsport Family&quot; audience. This pushes contact data to Mailchimp and pulls unsubscribe status back.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncResult("");
                const res = await fetch("/api/admin/mailchimp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ direction: "both" }),
                });
                const data = await res.json();
                if (res.ok) {
                  const push = data.results?.push;
                  const pull = data.results?.pull;
                  setSyncResult(
                    `Pushed ${push?.pushed || 0} contacts (${push?.errors || 0} errors). Updated ${pull?.updated || 0} unsubscribes.`
                  );
                } else {
                  setSyncResult("Sync failed: " + (data.error || "Unknown error"));
                }
                setSyncing(false);
              }}
              disabled={syncing}
              className="rounded-lg bg-catalyst-red px-5 py-2 font-heading text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
            {syncResult && (
              <p className="text-sm text-catalyst-grey-400">{syncResult}</p>
            )}
          </div>
        </div>
      )}

      {/* Account Info */}
      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold text-white">Account</h2>
        {user && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-white">{user.name}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white">{user.email}</p>
            </div>
            <div>
              <p className="text-xs text-catalyst-grey-500 uppercase tracking-wider mb-1">Role</p>
              <p className="text-white capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => {
            router.push("/admin/login?redirect=/admin/settings");
            fetch("/api/admin/logout", { method: "POST" });
          }}
          className="text-sm text-catalyst-grey-400 hover:text-white transition-colors"
        >
          Change Password
        </button>
      </div>

      {/* Team */}
      {user?.role === "admin" && (
        <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 sm:p-6 space-y-4">
          <h2 className="font-heading text-lg font-semibold text-white">Team</h2>
          {teamLoading ? (
            <p className="text-sm text-catalyst-grey-500">Loading...</p>
          ) : (
            <div className="space-y-2 text-sm">
              {teamUsers.map((tu, idx) => (
                <div
                  key={tu.id}
                  className={`py-3 ${idx < teamUsers.length - 1 ? "border-b border-catalyst-border/50" : ""}`}
                >
                  {editingId === tu.id ? (
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          className="flex-1 rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1.5 text-white text-sm placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
                        />
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email"
                          className="flex-1 rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1.5 text-white text-sm placeholder-catalyst-grey-600 focus:border-catalyst-red focus:outline-none"
                        />
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as "admin" | "user")}
                          className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1.5 text-white text-sm focus:border-catalyst-red focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveEdit(tu.id)}
                          className="rounded-lg bg-catalyst-red px-3 py-1 text-xs font-heading font-semibold text-white hover:bg-red-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="rounded-lg border border-catalyst-border px-3 py-1 text-xs font-heading font-semibold text-catalyst-grey-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-white ${tu.disabled ? "opacity-50" : ""}`}>{tu.name}</p>
                          {tu.role === "admin" ? (
                            <span className="text-xs text-catalyst-red font-medium">Admin</span>
                          ) : (
                            <span className="text-xs text-catalyst-grey-500">User</span>
                          )}
                          {tu.disabled && (
                            <span className="text-xs bg-catalyst-grey-600/30 text-catalyst-grey-400 px-1.5 py-0.5 rounded">Disabled</span>
                          )}
                        </div>
                        <p className={`text-catalyst-grey-500 ${tu.disabled ? "opacity-50" : ""}`}>{tu.email}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 shrink-0">
                        <button
                          onClick={() => startEdit(tu)}
                          className="text-xs text-catalyst-grey-400 hover:text-white transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleDisabled(tu)}
                          className="text-xs text-catalyst-grey-400 hover:text-white transition-colors"
                        >
                          {tu.disabled ? "Enable" : "Disable"}
                        </button>
                        {tu.id !== user.id && (
                          <>
                            {deletingId === tu.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteUser(tu.id)}
                                  className="text-xs text-catalyst-red hover:text-red-400 transition-colors font-semibold"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="text-xs text-catalyst-grey-400 hover:text-white transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(tu.id)}
                                className="text-xs text-catalyst-grey-400 hover:text-catalyst-red transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {teamUsers.length === 0 && (
                <p className="text-catalyst-grey-500 py-2">No team members found.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
