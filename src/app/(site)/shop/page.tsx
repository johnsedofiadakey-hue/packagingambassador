"use client";

import { PageHero } from "@/components/PageHero";
import { ShopCatalogue } from "@/components/ShopCatalogue";
import { useCart } from "@/lib/cart-context";
import { defaultVariant } from "@/lib/utils";

export default function ShopPage() {
  const { addToCart } = useCart();
  return (
    <div>
      <PageHero eyebrow="Our Catalogue" title="All Products" />
      <ShopCatalogue onQuickAdd={(p) => addToCart(p, defaultVariant(p))} />
    </div>
  );
}
