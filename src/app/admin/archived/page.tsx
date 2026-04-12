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
  archived: boolean;
}

export default function ArchivedContacts() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/quotes?archived=true")
      .then((r) => r.json())
      .then((d) => {
        setQuotes(d.quotes || []);
        setLoading(false);
      });
  }, []);

  async function unarchiveQuote(id: number) {
    const res = await fetch("/api/admin/quotes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: false }),
    });
    if (res.ok) {
      setQuotes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin")}
          className="text-catalyst-grey-500 hover:text-white transition-colors"
          title="Back to Dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">
          Archived Contacts ({quotes.length})
        </h1>
      </div>

      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-6 space-y-4">
        {loading ? (
          <p className="text-catalyst-grey-500">Loading...</p>
        ) : quotes.length === 0 ? (
          <p className="text-catalyst-grey-500">No archived contacts.</p>
        ) : (
          <>
          {/* Mobile card layout */}
          <div className="space-y-3 sm:hidden">
            {quotes.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-catalyst-border bg-catalyst-black p-4 cursor-pointer hover:border-catalyst-grey-600 transition-colors"
                onClick={() => router.push(`/admin/contact/${q.id}`)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-white font-medium">{q.name}</p>
                    <p className="text-xs text-catalyst-grey-500">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      unarchiveQuote(q.id);
                    }}
                    className="tooltip text-catalyst-grey-600 hover:text-green-500 transition-colors flex-shrink-0"
                    data-tip="Restore"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-catalyst-grey-300 truncate">{q.email}</p>
                  <p className="text-catalyst-grey-300">{q.phone}</p>
                  {q.service && <p className="text-catalyst-grey-400">Service: {q.service}</p>}
                  {q.vehicle && <p className="text-catalyst-grey-400">Vehicle: {q.vehicle}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table layout */}
          <div className="hidden sm:block">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-catalyst-border text-left text-catalyst-grey-400">
                  <th className="pb-3 pr-4 font-medium w-[90px]">Date</th>
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium w-[120px]">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Service</th>
                  <th className="pb-3 pr-4 font-medium">Vehicle</th>
                  <th className="pb-3 font-medium w-[50px]"></th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-catalyst-border/50 cursor-pointer hover:bg-white/5 transition-colors"
                    onClick={() => router.push(`/admin/contact/${q.id}`)}
                  >
                    <td className="py-3 pr-4 text-catalyst-grey-400 whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4 text-white truncate">{q.name}</td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.email}>
                      {q.email}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 whitespace-nowrap">
                      {q.phone}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.service}>
                      {q.service}
                    </td>
                    <td className="py-3 pr-4 text-catalyst-grey-300 truncate" title={q.vehicle}>
                      {q.vehicle}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unarchiveQuote(q.id);
                        }}
                        className="tooltip text-catalyst-grey-600 hover:text-green-500 transition-colors"
                        data-tip="Restore"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
