"use client";

import { useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { Product } from "@/lib/products";
import { useAdminData } from "@/lib/store";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const PRICE_RANGES = [
  { key: "all", label: "All Prices", test: () => true },
  { key: "under-60", label: "Under GH₵ 60", test: (p: Product) => p.price < 60 },
  { key: "60-100", label: "GH₵ 60 – 100", test: (p: Product) => p.price >= 60 && p.price <= 100 },
  { key: "100-plus", label: "GH₵ 100+", test: (p: Product) => p.price > 100 },
];

export function ShopCatalogue({ initialCategory }: { initialCategory?: string }) {
  const { products, categories } = useAdminData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "all");
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    const priceTest = PRICE_RANGES.find((r) => r.key === priceRange)?.test ?? (() => true);
    let list = products.filter((p) => {
      const matchesQuery = p.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesCategory && priceTest(p);
    });

    list = [...list];
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [products, query, category, priceRange, sort]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-cream-200 bg-cream-100 py-3 pl-11 pr-4 text-sm text-ink-900 placeholder:text-ink-700/50 focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-cream-200 bg-cream-100 px-5 py-3 text-sm font-medium text-ink-900 focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-8">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-700/70">
              Category
            </h3>
            <div className="mt-3 flex flex-col gap-1">
              <button
                onClick={() => setCategory("all")}
                className={cn(
                  "rounded-full px-4 py-2 text-left text-sm font-medium transition-colors",
                  category === "all"
                    ? "bg-amber-500 text-white"
                    : "text-ink-800 hover:bg-cream-100"
                )}
              >
                All Products
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    "rounded-full px-4 py-2 text-left text-sm font-medium transition-colors",
                    category === c.slug
                      ? "bg-amber-500 text-white"
                      : "text-ink-800 hover:bg-cream-100"
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-700/70">
              Price Range
            </h3>
            <div className="mt-3 flex flex-col gap-1">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setPriceRange(range.key)}
                  className={cn(
                    "rounded-full px-4 py-2 text-left text-sm font-medium transition-colors",
                    priceRange === range.key
                      ? "bg-amber-500 text-white"
                      : "text-ink-800 hover:bg-cream-100"
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <p className="mb-6 text-sm text-ink-700/70">
            {filtered.length} product{filtered.length === 1 ? "" : "s"} found
          </p>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-900/20 p-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-ink-700/40">
                <PackageSearch className="h-6 w-6" strokeWidth={1.5} />
              </span>
              <p className="text-ink-700/70">No products match your filters.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
