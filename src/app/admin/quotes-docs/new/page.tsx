"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  QuoteEditor,
  type EditorContact,
  type EditorProduct,
  type EditorSettings,
  type SessionUserShape,
} from "@/components/admin/QuoteEditor";

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-6 text-catalyst-grey-500">Loading…</div>}>
      <NewQuoteInner />
    </Suspense>
  );
}

function NewQuoteInner() {
  const router = useRouter();
  const search = useSearchParams();
  const contactIdParam = search.get("contactId");

  const [user, setUser] = useState<SessionUserShape | null>(null);
  const [contact, setContact] = useState<EditorContact | null>(null);
  const [products, setProducts] = useState<EditorProduct[]>([]);
  const [settings, setSettings] = useState<EditorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const meRes = await fetch("/api/admin/me");
      const meData = await meRes.json();
      if (cancelled) return;
      if (!meData.user) { router.replace("/admin/login"); return; }
      setUser(meData.user);

      const [prodRes, settingsRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/invoicing-settings"),
      ]);
      const [prodData, settingsData] = await Promise.all([prodRes.json(), settingsRes.json()]);
      if (cancelled) return;

      setProducts(prodData.products || []);
      if (settingsData.settings) setSettings(settingsData.settings);

      if (contactIdParam) {
        const cRes = await fetch(`/api/admin/contacts/${contactIdParam}`);
        const cData = await cRes.json();
        if (cancelled) return;
        if (cData.contact) setContact(cData.contact);
        else setError(cData.error || "Contact not found");
      } else {
        setError("No contact selected. Create a quote from a contact's detail page.");
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [contactIdParam, router]);

  if (loading) return <div className="p-6 text-catalyst-grey-500">Loading…</div>;
  if (!user || !settings) return null;
  if (error || !contact) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-catalyst-grey-400 mb-4">{error}</p>
        <Link href="/admin/crm/contacts" className="text-catalyst-red hover:underline">Back to contacts</Link>
      </div>
    );
  }

  return <QuoteEditor user={user} contact={contact} products={products} settings={settings} />;
}
