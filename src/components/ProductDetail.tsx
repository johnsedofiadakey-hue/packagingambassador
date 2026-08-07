"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Minus, Plus, ShoppingCart, Star, Truck } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { formatPrice, getDiscountPercent, getDisplayPrice, type PriceMode } from "@/lib/utils";
import { BADGE_STYLES, type Product } from "@/lib/products";

/**
 * Doesn't call useCart()/useWholesaleCart() itself — this component is mounted inside either
 * CartProvider (retail) or WholesaleCartProvider (wholesale), never both, and React hooks can't
 * be called conditionally. The parent page calls whichever hook is valid for its own provider
 * tree and passes the add function down.
 */
export function ProductDetail({
  product,
  mode = "retail",
  onAddToCart,
}: {
  product: Product;
  mode?: PriceMode;
  onAddToCart: (opts: { color: string; size: string; quantity: number }) => void;
}) {
  const isWholesale = mode === "wholesale";
  const minQty = isWholesale ? (product.wholesaleMinQty ?? 1) : 1;
  const price = getDisplayPrice(product, mode);
  const discount = isWholesale ? null : getDiscountPercent(product);
  const [color, setColor] = useState((product.colors || [])[0]?.name ?? "");
  const [size, setSize] = useState((product.sizes || [])[0] ?? "");
  const [quantity, setQuantity] = useState(minQty);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart({ color, size, quantity });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-700/70">
        <Link href="/" className="hover:text-ink-900">Home</Link>
        <span>/</span>
        <Link href={isWholesale ? "/wholesale" : "/shop"} className="hover:text-ink-900">
          {isWholesale ? "Wholesale" : "Shop"}
        </Link>
        <span>/</span>
        {!isWholesale && (
          <>
            <Link href={`/category/${product.category}`} className="hover:text-ink-900">
              {product.categoryLabel}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            className="aspect-square w-full rounded-3xl object-cover"
          />
        ) : (
          <ProductArt category={product.category} className="aspect-square w-full rounded-3xl" />
        )}

        <div>
          <div className="flex flex-wrap gap-2">
            {product.badge && (
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[product.badge]}`}
              >
                {product.badge}
              </span>
            )}
            {discount !== null && (
              <span className="inline-block rounded-full bg-forest-600 px-3 py-1 text-xs font-semibold text-white">
                -{discount}% OFF
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-1 text-sm text-ink-700/80">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-semibold">{product.rating}</span>
            <span>({product.reviewCount} reviews)</span>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-2">
            {discount !== null && (
              <span className="text-lg text-ink-700/40 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            <span className="font-display text-3xl font-bold text-ink-900">
              {formatPrice(price)}
            </span>
            <span className="text-ink-700/70">per {product.unit}</span>
            {isWholesale && minQty > 1 && (
              <span className="ml-1 rounded-full bg-forest-600/10 px-2.5 py-1 text-xs font-semibold text-forest-700">
                Min. order {minQty}
              </span>
            )}
          </div>

          <p className="mt-4 max-w-xl text-ink-700/80">{product.description}</p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink-900">Color: {color}</p>
            <div className="mt-2 flex gap-2">
              {(product.colors || []).map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  aria-label={c.name}
                  className={`h-9 w-9 rounded-full border-2 transition-all ${
                    color === c.name ? "border-ink-900 scale-110" : "border-transparent"
                  }`}
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink-900">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(product.sizes || []).map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    size === s
                      ? "bg-amber-500 text-white"
                      : "bg-cream-100 text-ink-800 hover:bg-cream-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink-900">Quantity</p>
            <div className="mt-2 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-cream-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(minQty, q - 1))}
                  className="p-3 text-ink-800 hover:text-amber-600"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="p-3 text-ink-800 hover:text-amber-600"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-ink-700/70">{product.stock} in stock</span>
            </div>
          </div>

          <motion.button
            onClick={handleAdd}
            whileTap={{ scale: 0.96 }}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-4 font-semibold text-white transition-colors hover:bg-amber-600 sm:w-auto sm:px-10"
          >
            <ShoppingCart className="h-5 w-5" />
            {justAdded ? "Added to Cart ✓" : `Add to Cart — ${formatPrice(price * quantity)}`}
          </motion.button>

          <div className="mt-6 flex flex-wrap gap-6 text-sm text-ink-700/80">
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600" /> Fast Ghana delivery
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-forest-700" /> Eco-friendly option
            </span>
          </div>

          <div className="mt-10 border-t border-cream-200 pt-6">
            <h2 className="font-display font-semibold text-ink-900">Specifications</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-700/80">
              {(product.specs || []).map((spec) => (
                <li key={spec} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {spec}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 border-t border-cream-200 pt-6">
            <h2 className="font-display font-semibold text-ink-900">Full Description</h2>
            <p className="mt-2 text-sm text-ink-700/80">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
