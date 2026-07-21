"use client";

import { useState } from "react";
import { PackageSearch } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { OrderStatusStepper } from "@/components/OrderStatusStepper";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/store";
import type { CartLine } from "@/lib/cart-context";

type TrackedOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  lines: CartLine[];
  subtotal: number;
};

export default function TrackPage() {
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHero eyebrow="Order Tracking" title="Track Your Order" />

      <section className="mx-auto max-w-lg px-6 py-16">
        <form onSubmit={handleSubmit} className="glass space-y-4 rounded-2xl p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Order Number
            </label>
            <input
              required
              placeholder="ORD-XXXXXXXX"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white/70 px-4 py-3 text-sm uppercase tracking-wide focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
          >
            {loading ? "Searching…" : "Track Order"}
          </button>
          {error && <p className="text-sm font-medium text-clay-700">{error}</p>}
        </form>

        {order && (
          <div className="mt-8 rounded-2xl border border-cream-200 bg-cream-50 p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                <PackageSearch className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display font-semibold text-ink-900">{order.id}</p>
                <p className="text-xs text-ink-700/60">
                  Placed {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <OrderStatusStepper status={order.status} />
            </div>

            <ul className="mt-6 divide-y divide-cream-200 border-t border-cream-200">
              {order.lines.map((line, i) => (
                <li key={i} className="flex items-center justify-between py-3 text-sm">
                  <span className="text-ink-800">
                    {line.name} × {line.quantity}
                  </span>
                  <span className="font-semibold text-ink-900">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between border-t border-cream-200 pt-3 font-display font-bold text-ink-900">
              <span>Total</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
