"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { BADGE_STYLES, type Product } from "@/lib/products";
import { ProductArt } from "@/components/ProductArt";
import { MotionLink } from "@/components/MotionLink";
import { formatPrice, getDiscountPercent } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const discount = getDiscountPercent(product);

  return (
    <MotionLink
      href={`/product/${product.slug}`}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50 transition-shadow hover:shadow-lg hover:shadow-ink-900/10"
    >
      <div className="relative">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <ProductArt category={product.category} className="aspect-square w-full" />
        )}
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {product.badge && (
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[product.badge]}`}
            >
              {product.badge}
            </span>
          )}
          {discount !== null && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-fit rounded-full bg-forest-600/90 px-3 py-1 text-xs font-semibold text-white"
            >
              -{discount}%
            </motion.span>
          )}
        </div>
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
        <div className="mt-2 flex items-baseline gap-2 text-ink-900">
          {discount !== null && (
            <span className="text-sm text-ink-700/40 line-through">
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
          <span className="font-display text-xl font-bold">{formatPrice(product.price)}</span>
          <span className="text-sm text-ink-700/70">per {product.unit}</span>
        </div>
      </div>
    </MotionLink>
  );
}
