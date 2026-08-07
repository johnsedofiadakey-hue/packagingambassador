"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, TrendingUp, Wallet, Mail } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";
import { loadAnalytics, type AnalyticsData } from "@/lib/analytics-queries";
import { formatPrice, cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";

function WeeklySummaryButton() {
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const send = async () => {
    setSending(true);
    setMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok && data.sent) {
        setMsg({ ok: true, text: "Weekly summary emailed to your store email." });
      } else {
        setMsg({ ok: false, text: data.reason ?? data.error ?? "Couldn't send the summary." });
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't send the summary. Please try again." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={send}
        disabled={sending}
        className="inline-flex items-center gap-2 rounded-full border border-ink-900/10 bg-cream-50 px-4 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-900/5 disabled:opacity-60"
      >
        <Mail className="h-4 w-4" />
        {sending ? "Sending…" : "Email weekly summary now"}
      </button>
      {msg && (
        <span className={cn("text-sm font-medium", msg.ok ? "text-forest-700" : "text-red-600")}>{msg.text}</span>
      )}
    </div>
  );
}

const RETAIL = "var(--color-amber-500)";
const WHOLESALE = "var(--color-forest-500)";

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof DollarSign }) {
  return (
    <div className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="text-sm text-ink-700/70">{label}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
      <h2 className="font-display font-semibold text-ink-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SplitBar({ retail, wholesale }: { retail: number; wholesale: number }) {
  const total = retail + wholesale;
  const retailPct = total > 0 ? (retail / total) * 100 : 0;
  const wholesalePct = total > 0 ? (wholesale / total) * 100 : 0;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-ink-900/5">
        <div style={{ width: `${retailPct}%`, background: RETAIL }} />
        <div style={{ width: `${wholesalePct}%`, background: WHOLESALE }} />
      </div>
      <div className="mt-3 flex justify-between text-sm">
        <span className="flex items-center gap-2 text-ink-700/80">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: RETAIL }} /> Retail
          <span className="font-semibold text-ink-900">{formatPrice(retail)}</span>
        </span>
        <span className="flex items-center gap-2 text-ink-700/80">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: WHOLESALE }} /> Wholesale
          <span className="font-semibold text-ink-900">{formatPrice(wholesale)}</span>
        </span>
      </div>
    </div>
  );
}

function MonthlyChart({ data }: { data: AnalyticsData["monthly"] }) {
  const max = Math.max(1, ...data.map((m) => m.retail + m.wholesale));
  return (
    <div>
      <div className="flex h-40 items-end justify-between gap-2">
        {data.map((m) => {
          const total = m.retail + m.wholesale;
          const retailH = (m.retail / max) * 100;
          const wholesaleH = (m.wholesale / max) * 100;
          return (
            <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="flex w-full max-w-[40px] flex-col justify-end overflow-hidden rounded-md"
                style={{ height: "128px" }}
                title={`${m.label}: ${formatPrice(total)}`}
              >
                <div style={{ height: `${wholesaleH}%`, background: WHOLESALE }} />
                <div style={{ height: `${retailH}%`, background: RETAIL }} />
              </div>
              <span className="text-xs text-ink-700/60">{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-500",
  Processing: "bg-blue-500",
  Delivered: "bg-forest-500",
  Cancelled: "bg-red-500",
};

export default function AdminAnalyticsPage() {
  const { products, businessCustomers } = useAdminData();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics()
      .then(setData)
      .catch((err) => {
        console.error("[analytics] load failed", err);
        setError("Couldn't load analytics. Please refresh to try again.");
      });
  }, []);

  if (error) {
    return (
      <div>
        <AdminPageHeader title="Analytics" />
        <p className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!data) return <PageLoading />;

  const bestSellers = [...products]
    .filter((p) => (p.unitsSold ?? 0) > 0)
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, 5);
  const topCustomers = [...businessCustomers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  const maxStatus = Math.max(1, ...Object.values(data.statusCounts));

  return (
    <div>
      <AdminPageHeader
        title="Analytics"
        description="Revenue and order performance across both channels."
      />

      <div className="mb-6">
        <WeeklySummaryButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={formatPrice(data.revenue.total)} icon={DollarSign} />
        <StatCard
          label="This Month"
          value={formatPrice(
            (data.monthly.at(-1)?.retail ?? 0) + (data.monthly.at(-1)?.wholesale ?? 0)
          )}
          icon={TrendingUp}
        />
        <StatCard label="Total Orders" value={String(data.orderCounts.total)} icon={ShoppingBag} />
        <StatCard label="Avg Order Value" value={formatPrice(Math.round(data.avgOrderValue))} icon={Wallet} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Revenue — Last 6 Months">
          <MonthlyChart data={data.monthly} />
        </Card>

        <Card title="Retail vs Wholesale">
          <SplitBar retail={data.revenue.retail} wholesale={data.revenue.wholesale} />
          <div className="mt-5 flex justify-between border-t border-ink-900/8 pt-4 text-sm text-ink-700/70">
            <span>{data.orderCounts.retail} retail orders</span>
            <span>{data.orderCounts.wholesale} wholesale orders</span>
          </div>
        </Card>

        <Card title="Orders by Status">
          <ul className="space-y-3">
            {Object.entries(data.statusCounts).map(([status, count]) => (
              <li key={status} className="flex items-center gap-3 text-sm">
                <span className="w-20 text-ink-700/80">{status}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink-900/5">
                  <div
                    className={`h-full rounded-full ${STATUS_COLORS[status] ?? "bg-ink-500"}`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-semibold text-ink-900">{count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Best Sellers">
          {bestSellers.length === 0 ? (
            <p className="text-sm text-ink-700/60">No sales recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {bestSellers.map((p, i) => (
                <li key={p.slug} className="flex items-center gap-3 text-sm">
                  <span className="font-display font-bold text-ink-700/40">{i + 1}</span>
                  <span className="flex-1 text-ink-900">{p.name}</span>
                  <span className="font-semibold text-ink-900">{p.unitsSold} sold</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Top Business Customers">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-ink-700/60">No wholesale customers yet.</p>
          ) : (
            <ul className="space-y-3">
              {topCustomers.map((c) => (
                <li key={c.id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-ink-900">{c.businessName}</span>
                  <span className="text-ink-700/60">{c.orderCount} orders</span>
                  <span className="w-20 text-right font-semibold text-ink-900">
                    {formatPrice(c.totalSpent)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
