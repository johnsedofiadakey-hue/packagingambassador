"use client";

import { PageHero } from "@/components/PageHero";
import { ShopCatalogue } from "@/components/ShopCatalogue";
import { useWholesaleCart } from "@/lib/wholesale-cart-context";
import { defaultVariant } from "@/lib/utils";

export default function WholesalePage() {
  const { addToWholesaleCart } = useWholesaleCart();
  return (
    <div>
      <PageHero eyebrow="Business Pricing" title="Wholesale Catalogue" />
      <ShopCatalogue
        mode="wholesale"
        onQuickAdd={(p) => addToWholesaleCart(p, defaultVariant(p, "wholesale"))}
      />
    </div>
  );
}
