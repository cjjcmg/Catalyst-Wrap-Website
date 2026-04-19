"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Renders the exact HTML of the 'Quote Sent' email — what the customer
 * would see if the Send button is clicked right now. Useful for staff to
 * review copy / branding before committing to send.
 */

interface PreviewData {
  subject: string;
  html: string;
  text: string;
  to: string;
  acceptanceUrl: string;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

export default function EmailPreviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qid = Number(params.id);

  const [user, setUser] = useState<SessionUser | null>(null);
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
  }, [router]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/admin/sales-quotes/${qid}/email-preview`)
      .then((r) => r.json())
      .then((d) => {
        if (d.subject) setData(d);
        else setError(d.error || "Failed to render preview");
        setLoading(false);
      });
  }, [user, qid]);

  if (!user || loading) return <div className="p-6 text-catalyst-grey-500">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
      <div>
        <Link href={`/admin/quotes-docs/${qid}`} className="text-catalyst-grey-500 hover:text-white text-sm">← Back to quote</Link>
        <h1 className="font-heading text-2xl font-bold text-white mt-1">Email preview</h1>
        <p className="text-sm text-catalyst-grey-500">What {data.to} will receive when you click Send.</p>
      </div>

      <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-5 space-y-1 text-sm">
        <div><span className="text-catalyst-grey-500 uppercase tracking-wide text-xs">To: </span><span className="text-white">{data.to}</span></div>
        <div><span className="text-catalyst-grey-500 uppercase tracking-wide text-xs">Subject: </span><span className="text-white">{data.subject}</span></div>
        <div><span className="text-catalyst-grey-500 uppercase tracking-wide text-xs">Acceptance URL: </span><a href={data.acceptanceUrl} target="_blank" rel="noopener noreferrer" className="text-catalyst-red hover:underline break-all">{data.acceptanceUrl}</a></div>
      </div>

      <iframe
        srcDoc={data.html}
        title="Email body"
        className="w-full h-[70vh] rounded-xl border border-catalyst-border bg-white"
      />

      <details className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
        <summary className="text-sm text-catalyst-grey-300 cursor-pointer">Plain-text fallback</summary>
        <pre className="mt-3 text-xs text-catalyst-grey-400 whitespace-pre-wrap">{data.text}</pre>
      </details>
    </div>
  );
}
