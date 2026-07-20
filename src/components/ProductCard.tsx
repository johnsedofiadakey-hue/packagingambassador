import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";
import { ProductArt } from "@/components/ProductArt";
import { formatPrice } from "@/lib/utils";

const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Eco-Friendly": "bg-forest-800 text-cream-50",
  New: "bg-ink-900 text-cream-50",
};

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50 transition-shadow hover:shadow-lg hover:shadow-ink-900/10"
    >
      <div className="relative">
        <ProductArt category={product.category} className="aspect-square w-full" />
        {product.badge && (
          <span
            className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[product.badge]}`}
          >
            {product.badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
          {product.categoryLabel}
        </span>
        <h3 className="font-display text-lg font-semibold text-ink-900 group-hover:underline">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-ink-700/80">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
          <span>{product.rating}</span>
          <span className="text-ink-700/50">({product.reviewCount})</span>
        </div>
        <div className="mt-2 text-ink-900">
          <span className="font-display text-xl font-bold">{formatPrice(product.price)}</span>
          <span className="ml-1 text-sm text-ink-700/70">per {product.unit}</span>
        </div>
      </div>
    </Link>
  );
}
