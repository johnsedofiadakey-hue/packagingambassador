"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useCart, lineKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { lines, updateQuantity, removeLine, itemCount, subtotal } = useCart();

  return (
    <div>
      <PageHero eyebrow="Your Cart" title={`${itemCount} item${itemCount === 1 ? "" : "s"}`} />

      <section className="mx-auto max-w-5xl px-6 py-16">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-ink-700/40">
              <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
            </span>
            <h2 className="font-display text-2xl font-semibold text-ink-900">
              Your cart is empty
            </h2>
            <p className="text-ink-700/70">Looks like you haven&apos;t added anything yet.</p>
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <ul className="divide-y divide-cream-200">
              {lines.map((line) => {
                const key = lineKey(line);
                return (
                  <li key={key} className="flex flex-wrap items-center gap-4 py-5">
                    <div className="flex-1">
                      <p className="font-display font-semibold text-ink-900">{line.name}</p>
                      <p className="text-sm text-ink-700/70">
                        {line.color} · {line.size} · {formatPrice(line.price)} per {line.unit}
                      </p>
                    </div>
                    <div className="flex items-center rounded-full border border-cream-200">
                      <button
                        onClick={() => updateQuantity(key, line.quantity - 1)}
                        className="p-2 text-ink-800 hover:text-amber-600"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(key, line.quantity + 1)}
                        className="p-2 text-ink-800 hover:text-amber-600"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="w-24 text-right font-display font-semibold text-ink-900">
                      {formatPrice(line.price * line.quantity)}
                    </p>
                    <button
                      onClick={() => removeLine(key)}
                      aria-label="Remove item"
                      className="text-forest-700/50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit rounded-2xl border border-cream-200 bg-cream-50 p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Order Summary
              </h2>
              <div className="mt-4 flex justify-between text-sm text-ink-700/80">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-ink-700/80">
                <span>Delivery</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-cream-200 pt-4 font-display text-lg font-bold text-ink-900">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <button className="mt-6 w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600">
                Checkout
              </button>
              <Link
                href="/shop"
                className="mt-3 block text-center text-sm font-semibold text-ink-800 hover:text-amber-600"
              >
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </section>
    </div>
  );
}
