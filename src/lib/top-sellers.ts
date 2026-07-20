import type { Product } from "@/lib/products";
import type { Order } from "@/lib/store";

export function getTopSellers(products: Product[], orders: Order[], count = 4): Product[] {
  const soldQuantity = new Map<string, number>();
  for (const order of orders) {
    if (order.status === "Cancelled") continue;
    for (const line of order.lines) {
      soldQuantity.set(line.slug, (soldQuantity.get(line.slug) ?? 0) + line.quantity);
    }
  }

  const ranked = products
    .filter((p) => soldQuantity.has(p.slug))
    .sort((a, b) => (soldQuantity.get(b.slug) ?? 0) - (soldQuantity.get(a.slug) ?? 0))
    .slice(0, count);

  if (ranked.length > 0) return ranked;

  const curated = products.filter((p) => p.badge === "Best Seller").slice(0, count);
  if (curated.length > 0) return curated;

  return products.slice(0, count);
}
