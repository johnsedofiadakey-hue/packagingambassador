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
