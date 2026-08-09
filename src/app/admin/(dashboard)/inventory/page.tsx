"use client";

import { useMemo, useState } from "react";
import { Search, PackageX, AlertTriangle, Boxes } from "lucide-react";
import { useAdminData } from "@/lib/store";
import type { Product } from "@/lib/products";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { products, settings, updateProduct, loading } = useAdminData();
  const threshold = settings.lowStockThreshold;

  const [search, setSearch] = useState("");
  const [sortLowFirst, setSortLowFirst] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);

  const stats = useMemo(() => {
    let out = 0;
    let low = 0;
    for (const p of products) {
      if (p.stock <= 0) out++;
      else if (p.stock <= threshold) low++;
    }
    return { total: products.length, out, low };
  }, [products, threshold]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.categoryLabel.toLowerCase().includes(q)
        )
      : [...products];
    filtered.sort((a, b) =>
      sortLowFirst ? a.stock - b.stock : a.name.localeCompare(b.name)
    );
    return filtered;
  }, [products, search, sortLowFirst]);

  const save = async (product: Product, next: number) => {
    if (!Number.isFinite(next) || next < 0) return;
    setSavingSlug(product.slug);
    try {
      const patch: Partial<Product> = { stock: next };
      // A restock above the threshold re-arms the low-stock alert for the next dip.
      if (next > threshold) patch.lowStockAlerted = false;
      await updateProduct(product.slug, patch);
      setDrafts((d) => {
        const { [product.slug]: _, ...rest } = d;
        return rest;
      });
    } finally {
      setSavingSlug(null);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description="Live stock levels, low-stock warnings, and quick restocking. Sales auto-deduct stock; adjustments here are logged to the activity log."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <StatCard icon={Boxes} label="Products tracked" value={stats.total} tone="ink" />
        <StatCard icon={AlertTriangle} label={`Low stock (≤ ${threshold})`} value={stats.low} tone="amber" />
        <StatCard icon={PackageX} label="Out of stock" value={stats.out} tone="red" />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-full border border-ink-900/8 bg-cream-50 py-2.5 pl-10 pr-4 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          />
        </div>
        <button
          onClick={() => setSortLowFirst((v) => !v)}
          className="shrink-0 rounded-full border border-ink-900/8 bg-cream-50 px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-900/5"
        >
          Sort: {sortLowFirst ? "Lowest stock first" : "Name (A–Z)"}
        </button>
      </div>

      {/* Mobile cards — touch-friendly stacked layout */}
      <div className="space-y-3 md:hidden">
        {rows.map((product) => {
          const draft = drafts[product.slug] ?? String(product.stock);
          const draftNum = parseInt(draft, 10);
          const dirty = String(product.stock) !== draft && Number.isFinite(draftNum);
          const status = product.stock <= 0 ? "out" : product.stock <= threshold ? "low" : "ok";
          return (
            <div key={product.slug} className="rounded-2xl border border-ink-900/8 bg-cream-50 p-4">
              <div className="flex items-center gap-3">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="h-11 w-11 rounded-lg object-cover" />
                ) : (
                  <div className="h-11 w-11 rounded-lg bg-sand-200" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink-900">{product.name}</p>
                  <p className="text-xs text-ink-700/60">{product.categoryLabel}</p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "text-lg font-bold",
                      status === "out" && "text-red-600",
                      status === "low" && "text-amber-600",
                      status === "ok" && "text-ink-900"
                    )}
                  >
                    {product.stock}
                  </span>
                  {status !== "ok" && (
                    <p className={cn("text-[10px] font-semibold", status === "out" ? "text-red-600" : "text-amber-700")}>
                      {status === "out" ? "Out of stock" : "Low"}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => save(product, product.stock + 50)}
                  disabled={savingSlug === product.slug}
                  className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-forest-600/10 hover:text-forest-700 disabled:opacity-50"
                >
                  +50
                </button>
                <button
                  onClick={() => save(product, product.stock + 100)}
                  disabled={savingSlug === product.slug}
                  className="rounded-xl border border-ink-900/10 px-3 py-2.5 text-sm font-semibold text-ink-700 hover:bg-forest-600/10 hover:text-forest-700 disabled:opacity-50"
                >
                  +100
                </button>
                <input
                  type="number"
                  min="0"
                  value={draft}
                  onChange={(e) => setDrafts((d) => ({ ...d, [product.slug]: e.target.value }))}
                  className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={() => save(product, draftNum)}
                  disabled={!dirty || savingSlug === product.slug}
                  className="shrink-0 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
                >
                  {savingSlug === product.slug ? "…" : "Set"}
                </button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-700/50">No products match your search.</p>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50 md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/60">
            <tr>
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">In stock</th>
              <th className="px-5 py-3 text-right">Adjust / Restock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {rows.map((product) => {
              const draft = drafts[product.slug] ?? String(product.stock);
              const draftNum = parseInt(draft, 10);
              const dirty = String(product.stock) !== draft && Number.isFinite(draftNum);
              const status =
                product.stock <= 0 ? "out" : product.stock <= threshold ? "low" : "ok";
              return (
                <tr key={product.slug}>
                  <td className="flex items-center gap-3 px-5 py-3">
                    {product.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-sand-200" />
                    )}
                    <span className="font-medium text-ink-900">{product.name}</span>
                  </td>
                  <td className="px-5 py-3 text-ink-700/80">{product.categoryLabel}</td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "font-semibold",
                        status === "out" && "text-red-600",
                        status === "low" && "text-amber-600",
                        status === "ok" && "text-ink-700/80"
                      )}
                    >
                      {product.stock}
                    </span>
                    {status === "out" && (
                      <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                        Out
                      </span>
                    )}
                    {status === "low" && (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        Low
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => save(product, product.stock + 50)}
                        disabled={savingSlug === product.slug}
                        className="rounded-full border border-ink-900/10 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-forest-600/10 hover:text-forest-700 disabled:opacity-50"
                      >
                        +50
                      </button>
                      <button
                        onClick={() => save(product, product.stock + 100)}
                        disabled={savingSlug === product.slug}
                        className="rounded-full border border-ink-900/10 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-forest-600/10 hover:text-forest-700 disabled:opacity-50"
                      >
                        +100
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={draft}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [product.slug]: e.target.value }))
                        }
                        className="w-20 rounded-lg border border-cream-200 bg-white px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
                      />
                      <button
                        onClick={() => save(product, draftNum)}
                        disabled={!dirty || savingSlug === product.slug}
                        className="rounded-full bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-40"
                      >
                        {savingSlug === product.slug ? "Saving…" : "Set"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-ink-700/50">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Boxes;
  label: string;
  value: number;
  tone: "ink" | "amber" | "red";
}) {
  const toneCls =
    tone === "red"
      ? "bg-red-500/10 text-red-600"
      : tone === "amber"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-ink-900/5 text-ink-800";
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-ink-900/8 bg-cream-50 px-5 py-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", toneCls)}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-2xl font-extrabold text-ink-900">{value}</p>
        <p className="text-xs text-ink-700/60">{label}</p>
      </div>
    </div>
  );
}
