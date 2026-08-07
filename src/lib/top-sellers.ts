import type { Product } from "@/lib/products";

// Ranks by the per-product `unitsSold` counter (incremented server-side at order creation),
// so best-sellers no longer depends on reducing over the whole orders collection. Falls back
// to curated "Best Seller" badges, then the first N, when there's no sales data yet.
export function getTopSellers(products: Product[], count = 4): Product[] {
  const ranked = products
    .filter((p) => (p.unitsSold ?? 0) > 0)
    .sort((a, b) => (b.unitsSold ?? 0) - (a.unitsSold ?? 0))
    .slice(0, count);

  if (ranked.length > 0) return ranked;

  const curated = products.filter((p) => p.badge === "Best Seller").slice(0, count);
  if (curated.length > 0) return curated;

  return products.slice(0, count);
}
