"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Minus, Plus, ShoppingCart, Star, Truck } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/products";

export function ProductDetail({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const handleAdd = () => {
    addToCart(product, { color, size, quantity });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-ink-700/70">
        <Link href="/" className="hover:text-ink-900">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-ink-900">Shop</Link>
        <span>/</span>
        <Link href={`/category/${product.category}`} className="hover:text-ink-900">
          {product.categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductArt category={product.category} className="aspect-square w-full rounded-3xl" />

        <div>
          {product.badge && (
            <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
              {product.badge}
            </span>
          )}
          <h1 className="mt-3 font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-1 text-sm text-ink-700/80">
            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            <span className="font-semibold">{product.rating}</span>
            <span>({product.reviewCount} reviews)</span>
          </div>

          <div className="mt-4">
            <span className="font-display text-3xl font-bold text-ink-900">
              {formatPrice(product.price)}
            </span>
            <span className="ml-2 text-ink-700/70">per {product.unit}</span>
          </div>

          <p className="mt-4 max-w-xl text-ink-700/80">{product.description}</p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink-900">Color: {color}</p>
            <div className="mt-2 flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`h-9 w-9 rounded-full border-2 transition-all ${
                    color === c ? "border-ink-900 scale-110" : "border-transparent"
                  }`}
                  style={{ background: swatchColor(c) }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-ink-900">Size</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
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
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
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

          <button
            onClick={handleAdd}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-amber-500 py-4 font-semibold text-white transition-colors hover:bg-amber-600 sm:w-auto sm:px-10"
          >
            <ShoppingCart className="h-5 w-5" />
            {justAdded ? "Added to Cart ✓" : `Add to Cart — ${formatPrice(product.price * quantity)}`}
          </button>

          {justAdded && (
            <button
              onClick={() => router.push("/cart")}
              className="mt-3 block text-sm font-semibold text-ink-800 underline hover:text-amber-600"
            >
              View cart
            </button>
          )}

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
              {product.specs.map((spec) => (
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

function swatchColor(name: string) {
  const map: Record<string, string> = {
    "Natural Kraft": "#c8a373",
    "Forest Green": "#3a5230",
    Clay: "#c07a5a",
    Clear: "#e7e2d8",
  };
  return map[name] ?? "#c8a373";
}
