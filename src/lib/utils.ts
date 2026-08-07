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

export function getDisplayPrice(
  product: { price: number; wholesalePrice?: number },
  mode: PriceMode = "retail"
) {
  return mode === "wholesale" ? (product.wholesalePrice ?? product.price) : product.price;
}

/** First colour + size, and the min-legal quantity — for quick-add straight from a card. */
export function defaultVariant(
  product: { colors: { name: string }[]; sizes: string[]; wholesaleMinQty?: number },
  mode: PriceMode = "retail"
) {
  return {
    color: product.colors[0]?.name ?? "",
    size: product.sizes[0] ?? "",
    quantity: mode === "wholesale" ? (product.wholesaleMinQty ?? 1) : 1,
  };
}
