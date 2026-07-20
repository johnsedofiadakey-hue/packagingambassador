"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { useCart, lineKey } from "@/lib/cart-context";
import { useAdminData } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { lines, updateQuantity, removeLine, clearCart, itemCount, subtotal } = useCart();
  const { addOrder, settings } = useAdminData();
  const [checkingOut, setCheckingOut] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", address: "" });
  const [placingOrder, setPlacingOrder] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlacingOrder(true);
    const order = await addOrder({
      customerName: details.name,
      phone: details.phone,
      email: details.email || undefined,
      address: details.address,
      lines,
      subtotal,
    });
    clearCart();
    setConfirmedOrderId(order.id);
    setCheckingOut(false);
    setPlacingOrder(false);

    fetch("/api/notifications/order-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        subtotal: order.subtotal,
        smsSenderId: settings.smsSenderId,
        emailFromAddress: settings.emailFromAddress,
        storeEmail: settings.storeEmail,
      }),
    }).catch(() => {
      // Best-effort — checkout already succeeded regardless of notification delivery.
    });
  };

  if (confirmedOrderId) {
    return (
      <div>
        <PageHero eyebrow="Order Placed" title="Thank You!" />
        <section className="mx-auto max-w-lg px-6 py-16 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
            Order {confirmedOrderId} received
          </h2>
          <p className="mt-2 text-ink-700/70">
            We&apos;ve logged your order and our team will reach out to confirm delivery details
            and payment.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
          >
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    );
  }

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
                      className="text-ink-700/50 hover:text-red-600"
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

              {!checkingOut ? (
                <button
                  onClick={() => setCheckingOut(true)}
                  className="mt-6 w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  Checkout
                </button>
              ) : (
                <form onSubmit={handlePlaceOrder} className="mt-6 space-y-3">
                  <input
                    required
                    placeholder="Full name"
                    value={details.name}
                    onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Phone number"
                    value={details.phone}
                    onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={details.email}
                    onChange={(e) => setDetails((d) => ({ ...d, email: e.target.value }))}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                  />
                  <textarea
                    required
                    rows={2}
                    placeholder="Delivery address"
                    value={details.address}
                    onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                  />
                  <p className="text-xs text-ink-700/50">
                    Online payment isn&apos;t connected yet — placing an order logs it for our
                    team to confirm delivery and payment with you directly.
                  </p>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
                  >
                    {placingOrder ? "Placing Order…" : "Place Order"}
                  </button>
                </form>
              )}

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
