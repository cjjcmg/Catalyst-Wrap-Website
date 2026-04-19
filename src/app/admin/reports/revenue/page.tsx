"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// recharts is client-only; load dynamically with ssr off
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), { ssr: false });
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), { ssr: false });
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), { ssr: false });

type Preset = "today" | "week" | "month" | "quarter" | "ytd" | "custom";

interface ReportData {
  range: { from: string; to: string; label: string };
  kpi: {
    total_paid: number;
    outstanding: number;
    quotes_sent: number;
    acceptance_rate: number;
    avg_deal_size: number;
    avg_conversion_hours: number;
  };
  revenue_by_month: Array<{ month: string; amount: number }>;
  revenue_by_category: Array<{ category: string; amount: number }>;
  funnel: { sent: number; viewed: number; accepted: number; paid: number };
  top_customers: Array<{ contact_id: number; name: string; amount: number }>;
  top_salespeople: Array<{ agent_id: number; name: string; amount: number }>;
}

interface SessionUser { id: number; name: string; email: string; role: "admin" | "user" }

const CATEGORY_COLORS: Record<string, string> = {
  wrap: "#E10600",
  ppf: "#3B82F6",
  ceramic: "#8B5CF6",
  detail: "#10B981",
  other: "#6B7280",
};

function money(n: number): string {
  return "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export default function RevenueReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("ytd");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    fetch("/api/admin/me").then((r) => r.json()).then((d) => {
      if (!d.user) router.replace("/admin/login"); else setUser(d.user);
    });
  }, [router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (preset === "custom") {
      if (customFrom) params.set("from", customFrom);
      if (customTo) params.set("to", customTo);
    } else {
      params.set("preset", preset);
    }
    const r = await fetch(`/api/admin/reports/revenue?${params.toString()}`);
    const d = await r.json();
    if (r.ok) setData(d);
    setLoading(false);
  }, [preset, customFrom, customTo]);

  useEffect(() => {
    if (!user) return;
    if (preset !== "custom") fetchData();
  }, [user, preset, fetchData]);

  function runCustom() {
    if (customFrom && customTo) fetchData();
  }

  function exportCsv() {
    if (!data) return;
    const from = data.range.from.slice(0, 10);
    const to = data.range.to.slice(0, 10);
    window.open(`/api/admin/reports/revenue/export?from=${from}&to=${to}`, "_blank");
  }

  const funnelData = useMemo(() => {
    if (!data) return [];
    return [
      { stage: "Sent", count: data.funnel.sent },
      { stage: "Viewed", count: data.funnel.viewed },
      { stage: "Accepted", count: data.funnel.accepted },
      { stage: "Paid", count: data.funnel.paid },
    ];
  }, [data]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white">Revenue</h1>
          <p className="text-sm text-catalyst-grey-500 mt-1">Paid revenue, outstanding balance, quote funnel, and top performers.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={!data}
          className="rounded-lg border border-catalyst-border px-4 py-2 text-sm text-white hover:bg-white/5 transition-colors disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-1 border-b border-catalyst-border">
        <button onClick={() => router.push("/admin/reports/revenue")} className="px-4 py-2 text-sm font-medium border-b-2 border-catalyst-red text-white">Revenue</button>
        <button onClick={() => router.push("/admin/reports/audit")} className="px-4 py-2 text-sm font-medium border-b-2 border-transparent text-catalyst-grey-400 hover:text-white transition-colors">Audit feed</button>
      </div>

      {/* Preset pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["today", "week", "month", "quarter", "ytd", "custom"] as Preset[]).map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors ${
              preset === p
                ? "bg-catalyst-red text-white"
                : "bg-catalyst-card text-catalyst-grey-400 border border-catalyst-border hover:text-white"
            }`}
          >
            {p === "ytd" ? "YTD" : p}
          </button>
        ))}
        {preset === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1 text-sm text-white" />
            <span className="text-catalyst-grey-500 text-sm">to</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="rounded-lg border border-catalyst-border bg-catalyst-black px-3 py-1 text-sm text-white" />
            <button onClick={runCustom} disabled={!customFrom || !customTo} className="rounded-lg bg-catalyst-red px-3 py-1 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40">Run</button>
          </div>
        )}
      </div>

      {loading && <p className="text-catalyst-grey-500 text-sm">Loading...</p>}

      {data && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Kpi label="Total paid" value={money(data.kpi.total_paid)} tone="green" />
            <Kpi label="Outstanding" value={money(data.kpi.outstanding)} tone="amber" />
            <Kpi label="Quotes sent" value={data.kpi.quotes_sent.toLocaleString()} />
            <Kpi label="Acceptance rate" value={`${(data.kpi.acceptance_rate * 100).toFixed(1)}%`} />
            <Kpi label="Avg deal size" value={money(data.kpi.avg_deal_size)} />
            <Kpi label="Conversion time" value={`${data.kpi.avg_conversion_hours.toFixed(1)}h`} />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-4">
            <Card title="Revenue by month (rolling 12)">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <LineChart data={data.revenue_by_month}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="month" tickFormatter={(v) => monthLabel(String(v))} stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 6 }}
                      labelFormatter={(label) => monthLabel(String(label))}
                      formatter={(value) => [money(Number(value)), "Paid"] as [string, string]}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#E10600" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Revenue by category">
              <div style={{ width: "100%", height: 260 }}>
                {data.revenue_by_category.length === 0 ? (
                  <p className="text-xs text-catalyst-grey-500 italic py-10 text-center">No paid invoices in this range.</p>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.revenue_by_category}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={(entry) => {
                          const { category, amount } = entry as unknown as { category: string; amount: number };
                          return `${category} ${money(amount)}`;
                        }}
                      >
                        {data.revenue_by_category.map((entry) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || "#888"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 6 }}
                        formatter={(value) => money(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <Card title="Quote funnel">
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="stage" stroke="#888" fontSize={11} />
                    <YAxis stroke="#888" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", borderRadius: 6 }} />
                    <Bar dataKey="count" fill="#E10600" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Top customers">
              {data.top_customers.length === 0 ? (
                <p className="text-xs text-catalyst-grey-500 italic py-4">No paying customers in this range.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.top_customers.map((c) => (
                      <tr key={c.contact_id} className="border-b border-catalyst-border/50 last:border-b-0">
                        <td className="py-1.5">
                          <button onClick={() => router.push(`/admin/crm/contacts/${c.contact_id}`)} className="text-white hover:text-catalyst-red text-left">
                            {c.name}
                          </button>
                        </td>
                        <td className="py-1.5 text-right font-semibold text-white">{money(c.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card title="Top salespeople">
              {data.top_salespeople.length === 0 ? (
                <p className="text-xs text-catalyst-grey-500 italic py-4">No assigned-agent paid deals in this range.</p>
              ) : (
                <table className="w-full text-sm">
                  <tbody>
                    {data.top_salespeople.map((a) => (
                      <tr key={a.agent_id} className="border-b border-catalyst-border/50 last:border-b-0">
                        <td className="py-1.5 text-white">{a.name}</td>
                        <td className="py-1.5 text-right font-semibold text-white">{money(a.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "green" | "amber" }) {
  const valueCls = tone === "green" ? "text-green-400" : tone === "amber" ? "text-amber-400" : "text-white";
  return (
    <div className="rounded-xl border border-catalyst-border bg-catalyst-card p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-catalyst-grey-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${valueCls}`}>{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-catalyst-border bg-catalyst-card p-4 space-y-3">
      <h2 className="font-heading text-base font-semibold text-white">{title}</h2>
      {children}
    </section>
  );
}
