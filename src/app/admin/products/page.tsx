"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Category = "wrap" | "ppf" | "ceramic" | "detail";
type SizeTier = "small" | "mid" | "suv" | "truck" | "exotic";

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "wrap", label: "Vinyl Wraps" },
  { id: "ppf", label: "Paint Protection Film" },
  { id: "ceramic", label: "Ceramic Coatings" },
  { id: "detail", label: "Detail & Correction" },
];

const SIZE_TIERS: { id: SizeTier; label: string }[] = [
  { id: "small", label: "Small" },
  { id: "mid", label: "Mid" },
  { id: "suv", label: "SUV" },
  { id: "truck", label: "Truck" },
  { id: "exotic", label: "Exotic" },
];

interface PricingRow {
  size_tier: SizeTier;
  default_price: number;
}

interface Product {
  id: number;
  category: Category;
  name: string;
  description: string | null;
  is_taxable: boolean;
  is_active: boolean;
  sort_order: number;
  product_pricing: PricingRow[];
}

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
}

function toPricingMap(rows: PricingRow[]): Record<SizeTier, string> {
  const out: Record<SizeTier, string> = { small: "", mid: "", suv: "", truck: "", exotic: "" };
  for (const r of rows || []) out[r.size_tier] = String(r.default_price);
  return out;
}

export default function ProductsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  // local edits (keyed by product id) — allow in-place editing without committing
  const [edits, setEdits] = useState<Record<number, Partial<Product> & { pricing?: Record<SizeTier, string> }>>({});

  // new-product drafts per category
  const [drafts, setDrafts] = useState<Record<Category, { open: boolean; name: string; description: string; is_taxable: boolean; pricing: Record<SizeTier, string> }>>({
    wrap: blankDraft(),
    ppf: blankDraft(),
    ceramic: blankDraft(),
    detail: blankDraft(),
  });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/admin/products?include_inactive=${includeInactive ? "1" : "0"}`);
    const d = await r.json();
    if (r.ok) setProducts(d.products || []);
    else setError(d.error || "Failed to load products");
    setLoading(false);
  }, [includeInactive]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) router.replace("/admin/login");
        else setUser(d.user);
      });
  }, [router]);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const grouped = useMemo(() => {
    const g: Record<Category, Product[]> = { wrap: [], ppf: [], ceramic: [], detail: [] };
    for (const p of products) g[p.category].push(p);
    return g;
  }, [products]);

  function setEdit(id: number, patch: Partial<Product>) {
    setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } }));
  }
  function setPriceEdit(id: number, tier: SizeTier, value: string, current: Record<SizeTier, string>) {
    setEdits((e) => ({
      ...e,
      [id]: {
        ...e[id],
        pricing: { ...(e[id]?.pricing || current), [tier]: value },
      },
    }));
  }

  async function saveProduct(p: Product) {
    setSavingId(p.id);
    setError("");
    const edit = edits[p.id] || {};
    const patch: Record<string, unknown> = {};
    if (edit.name !== undefined && edit.name !== p.name) patch.name = edit.name;
    if (edit.description !== undefined && (edit.description ?? "") !== (p.description ?? "")) patch.description = edit.description;
    if (edit.is_taxable !== undefined && edit.is_taxable !== p.is_taxable) patch.is_taxable = edit.is_taxable;
    if (edit.is_active !== undefined && edit.is_active !== p.is_active) patch.is_active = edit.is_active;
    if (edit.sort_order !== undefined && edit.sort_order !== p.sort_order) patch.sort_order = edit.sort_order;

    try {
      if (Object.keys(patch).length > 0) {
        const r = await fetch(`/api/admin/products/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!r.ok) throw new Error("Failed to save product");
      }
      if (edit.pricing) {
        const numericPricing: Record<string, number | null> = {};
        for (const t of SIZE_TIERS) {
          const raw = edit.pricing[t.id];
          numericPricing[t.id] = raw === "" || raw == null ? null : Number(raw);
        }
        const r = await fetch(`/api/admin/products/${p.id}/pricing`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pricing: numericPricing }),
        });
        if (!r.ok) throw new Error("Failed to save pricing");
      }
      setEdits((e) => {
        const next = { ...e };
        delete next[p.id];
        return next;
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function toggleActive(p: Product) {
    const next = !p.is_active;
    const r = await fetch(`/api/admin/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: next }),
    });
    if (r.ok) load();
    else setError("Failed to toggle active");
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const r = await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    if (r.ok) load();
    else {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Failed to delete (may be referenced by quotes)");
    }
  }

  async function createProduct(cat: Category) {
    const d = drafts[cat];
    if (!d.name.trim()) return;
    setError("");
    const numericPricing: Record<string, number> = {};
    for (const t of SIZE_TIERS) {
      const raw = d.pricing[t.id];
      if (raw !== "" && !Number.isNaN(Number(raw))) numericPricing[t.id] = Number(raw);
    }
    const r = await fetch(`/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: cat,
        name: d.name.trim(),
        description: d.description.trim() || null,
        is_taxable: d.is_taxable,
        pricing: numericPricing,
      }),
    });
    if (r.ok) {
      setDrafts((s) => ({ ...s, [cat]: blankDraft() }));
      await load();
    } else {
      const j = await r.json().catch(() => ({}));
      setError(j.error || "Failed to create product");
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Product Catalog</h1>
          <p className="text-sm text-catalyst-grey-500 mt-1">Manage services and size-tier pricing used when building quotes.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-catalyst-grey-400">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-catalyst-grey-500">Loading...</p>
      ) : (
        CATEGORIES.map((cat) => {
          const list = grouped[cat.id] || [];
          const draft = drafts[cat.id];
          return (
            <section key={cat.id} className="rounded-xl border border-catalyst-border bg-catalyst-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-catalyst-border px-4 py-3">
                <h2 className="font-heading text-lg font-semibold text-white">{cat.label}</h2>
                <span className="text-xs text-catalyst-grey-500">{list.length} product{list.length === 1 ? "" : "s"}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-catalyst-black/30 text-xs uppercase tracking-wide text-catalyst-grey-500">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium w-8">#</th>
                      <th className="px-3 py-2 text-left font-medium min-w-[220px]">Name / Description</th>
                      <th className="px-3 py-2 text-center font-medium">Tax</th>
                      <th className="px-3 py-2 text-center font-medium">Active</th>
                      {SIZE_TIERS.map((t) => (
                        <th key={t.id} className="px-2 py-2 text-right font-medium">{t.label}</th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => {
                      const e = edits[p.id] || {};
                      const livePricing = e.pricing || toPricingMap(p.product_pricing || []);
                      const dirty = !!edits[p.id];
                      return (
                        <tr key={p.id} className={`border-t border-catalyst-border/50 ${p.is_active ? "" : "opacity-50"}`}>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="number"
                              className="w-12 rounded border border-catalyst-border bg-catalyst-black px-1 py-1 text-xs text-white"
                              value={e.sort_order ?? p.sort_order}
                              onChange={(ev) => setEdit(p.id, { sort_order: Number(ev.target.value) })}
                            />
                          </td>
                          <td className="px-3 py-2 align-top">
                            <input
                              type="text"
                              className="w-full rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-sm text-white"
                              value={e.name ?? p.name}
                              onChange={(ev) => setEdit(p.id, { name: ev.target.value })}
                            />
                            <input
                              type="text"
                              placeholder="Description"
                              className="mt-1 w-full rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-xs text-catalyst-grey-400"
                              value={(e.description ?? p.description) || ""}
                              onChange={(ev) => setEdit(p.id, { description: ev.target.value })}
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-center">
                            <input
                              type="checkbox"
                              checked={e.is_taxable ?? p.is_taxable}
                              onChange={(ev) => setEdit(p.id, { is_taxable: ev.target.checked })}
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-center">
                            <button
                              onClick={() => toggleActive(p)}
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                p.is_active ? "bg-green-500/15 text-green-400" : "bg-catalyst-border text-catalyst-grey-500"
                              }`}
                            >
                              {p.is_active ? "On" : "Off"}
                            </button>
                          </td>
                          {SIZE_TIERS.map((t) => (
                            <td key={t.id} className="px-2 py-2 align-top text-right">
                              <input
                                type="number"
                                step="0.01"
                                inputMode="decimal"
                                className="w-20 rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-right text-sm text-white"
                                value={livePricing[t.id] ?? ""}
                                onChange={(ev) => setPriceEdit(p.id, t.id, ev.target.value, toPricingMap(p.product_pricing || []))}
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 align-top text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => saveProduct(p)}
                                disabled={!dirty || savingId === p.id}
                                className="rounded-lg bg-catalyst-red px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                              >
                                {savingId === p.id ? "..." : "Save"}
                              </button>
                              {user.role === "admin" && (
                                <button
                                  onClick={() => deleteProduct(p)}
                                  className="rounded-lg border border-red-500/30 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                                  title="Delete (admin)"
                                >
                                  Del
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* New-product row */}
                    <tr className="border-t border-catalyst-border/50 bg-catalyst-black/20">
                      {!draft.open ? (
                        <td colSpan={8 + SIZE_TIERS.length - 1} className="px-3 py-3">
                          <button
                            onClick={() => setDrafts((s) => ({ ...s, [cat.id]: { ...s[cat.id], open: true } }))}
                            className="text-sm text-catalyst-red hover:text-red-400 font-medium"
                          >
                            + Add product to {cat.label}
                          </button>
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-2 align-top text-catalyst-grey-600 text-xs">new</td>
                          <td className="px-3 py-2 align-top">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Product name"
                              className="w-full rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-sm text-white"
                              value={draft.name}
                              onChange={(ev) => setDrafts((s) => ({ ...s, [cat.id]: { ...s[cat.id], name: ev.target.value } }))}
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              className="mt-1 w-full rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-xs text-catalyst-grey-400"
                              value={draft.description}
                              onChange={(ev) => setDrafts((s) => ({ ...s, [cat.id]: { ...s[cat.id], description: ev.target.value } }))}
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-center">
                            <input
                              type="checkbox"
                              checked={draft.is_taxable}
                              onChange={(ev) => setDrafts((s) => ({ ...s, [cat.id]: { ...s[cat.id], is_taxable: ev.target.checked } }))}
                            />
                          </td>
                          <td className="px-3 py-2 align-top text-center text-xs text-catalyst-grey-500">—</td>
                          {SIZE_TIERS.map((t) => (
                            <td key={t.id} className="px-2 py-2 align-top text-right">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0"
                                className="w-20 rounded border border-catalyst-border bg-catalyst-black px-2 py-1 text-right text-sm text-white"
                                value={draft.pricing[t.id]}
                                onChange={(ev) =>
                                  setDrafts((s) => ({
                                    ...s,
                                    [cat.id]: {
                                      ...s[cat.id],
                                      pricing: { ...s[cat.id].pricing, [t.id]: ev.target.value },
                                    },
                                  }))
                                }
                              />
                            </td>
                          ))}
                          <td className="px-3 py-2 align-top text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => createProduct(cat.id)}
                                className="rounded-lg bg-catalyst-red px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                              >
                                Create
                              </button>
                              <button
                                onClick={() => setDrafts((s) => ({ ...s, [cat.id]: blankDraft() }))}
                                className="rounded-lg border border-catalyst-border px-2 py-1 text-xs text-catalyst-grey-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>

                    {list.length === 0 && !draft.open && (
                      <tr>
                        <td colSpan={8 + SIZE_TIERS.length - 1} className="px-3 py-6 text-center text-sm text-catalyst-grey-500">
                          No products in this category yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}

function blankDraft() {
  return {
    open: false,
    name: "",
    description: "",
    is_taxable: true,
    pricing: { small: "", mid: "", suv: "", truck: "", exotic: "" } as Record<SizeTier, string>,
  };
}
