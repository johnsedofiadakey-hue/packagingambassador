import type { SizeOption } from "@/lib/products";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(price: number) {
  return `GH₵ ${price}`;
}

export function getDiscountPercent(product: { price: number; compareAtPrice?: number }) {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return null;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

export type PriceMode = "retail" | "wholesale";

/** Base (size-agnostic) price for a channel. Coerces a missing/invalid price to 0 so a
 *  product saved without a price shows "GH₵ 0" rather than "GH₵ NaN". */
export function getDisplayPrice(
  product: { price: number; wholesalePrice?: number },
  mode: PriceMode = "retail"
) {
  const raw = mode === "wholesale" ? (product.wholesalePrice ?? product.price) : product.price;
  return Number.isFinite(raw) ? raw : 0;
}

/**
 * Sizes are stored as `SizeOption[]`, but legacy Firestore docs may still hold a plain
 * `string[]`. This maps either shape to `SizeOption[]` so every reader is safe.
 */
export function normalizeSizes(sizes: unknown): SizeOption[] {
  if (!Array.isArray(sizes)) return [];
  return sizes
    .map((s) => (typeof s === "string" ? { name: s } : (s as SizeOption)))
    .filter((s): s is SizeOption => Boolean(s && typeof s.name === "string" && s.name.length > 0));
}

type PricedProduct = { price: number; wholesalePrice?: number; sizes: SizeOption[] };

/** Effective price for a chosen size — its per-size override, else the product's base price. */
export function sizePrice(product: PricedProduct, sizeName: string, mode: PriceMode = "retail"): number {
  const base = getDisplayPrice(product, mode);
  const opt = normalizeSizes(product.sizes).find((s) => s.name === sizeName);
  if (!opt) return base;
  const override = mode === "wholesale" ? opt.wholesalePrice : opt.price;
  return typeof override === "number" && override > 0 ? override : base;
}

/** Min/max effective price across a product's sizes — powers the "From GH₵ X" card label. */
export function priceRange(
  product: PricedProduct,
  mode: PriceMode = "retail"
): { min: number; max: number; varies: boolean } {
  const base = getDisplayPrice(product, mode);
  const sizes = normalizeSizes(product.sizes);
  const prices = sizes.length
    ? sizes.map((s) => {
        const override = mode === "wholesale" ? s.wholesalePrice : s.price;
        return typeof override === "number" && override > 0 ? override : base;
      })
    : [base];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, varies: max > min };
}

/** First colour + size, and the min-legal quantity — for quick-add straight from a card. */
export function defaultVariant(
  product: { colors: { name: string }[]; sizes: SizeOption[]; wholesaleMinQty?: number },
  mode: PriceMode = "retail"
) {
  return {
    color: product.colors[0]?.name ?? "",
    size: normalizeSizes(product.sizes)[0]?.name ?? "",
    quantity: mode === "wholesale" ? (product.wholesaleMinQty ?? 1) : 1,
  };
}
