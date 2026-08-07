"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { PageLoading } from "@/components/PageLoading";
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
  isWholesale?: boolean;
};

export default function TrackPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <TrackPageInner />
    </Suspense>
  );
}

function TrackPageInner() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const autoTracked = useRef(false);

  const runTrack = async (id: string) => {
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
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

  useEffect(() => {
    const fromLink = searchParams.get("order");
    if (fromLink && !autoTracked.current) {
      autoTracked.current = true;
      runTrack(fromLink);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runTrack(orderId);
  };

  // Live updates: once an order is shown, silently re-poll its status so a staff
  // update in the admin console reflects here without the customer refreshing.
  // Stops at a terminal status and pauses while the tab is hidden — both keep this
  // well under the /track rate limit. A transient poll failure keeps the last
  // known state on screen rather than wiping it.
  const isTerminal = order?.status === "Delivered" || order?.status === "Cancelled";
  useEffect(() => {
    if (!order || isTerminal) return;
    const id = order.id;
    const interval = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/orders/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: id }),
        });
        if (!res.ok) return;
        const data = await res.json();
        setOrder((prev) => (prev && prev.id === data.id ? data : prev));
      } catch {
        /* keep the last good state on a transient poll error */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [order, isTerminal]);

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

            {!isTerminal && (
              <p className="mt-3 flex items-center gap-2 text-xs font-medium text-ink-700/60">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest-500/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-forest-600" />
                </span>
                Updating live
              </p>
            )}

            <ul className="mt-6 divide-y divide-cream-200 border-t border-cream-200">
              {order.lines.map((line, i) => (
                <li key={i} className="flex items-center gap-3 py-3 text-sm">
                  {line.image ? (
                    <img
                      src={line.image}
                      alt={line.name}
                      className="h-10 w-10 shrink-0 rounded-lg border border-cream-200 object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cream-200 bg-cream-100 text-xs text-ink-700/40">
                      —
                    </span>
                  )}
                  <span className="flex-1 text-ink-800">
                    {line.name} ({line.color}, {line.size}) × {line.quantity}
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

            {order.isWholesale && (
              <div className="mt-6 flex w-full gap-4">
                <a
                  href={`/wholesale/invoice/${order.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl border border-ink-900/15 bg-white px-4 py-3 text-center text-sm font-semibold text-ink-900 hover:bg-cream-100"
                >
                  Download Invoice
                </a>
                <a
                  href={`/wholesale/waybill/${order.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl border border-ink-900/15 bg-white px-4 py-3 text-center text-sm font-semibold text-ink-900 hover:bg-cream-100"
                >
                  Download Waybill
                </a>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
