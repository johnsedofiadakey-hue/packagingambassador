"use client";

import { useState } from "react";
import type { CartLine } from "@/lib/cart-context";

type PlaceOrderArgs = {
  /** Email Paystack needs for the receipt. */
  email: string;
  /** Channel-specific customer object sent to the verify route + Paystack metadata. */
  customer: Record<string, unknown>;
  /** Fired once payment verifies and the order exists — do clearCart + notifications here. */
  onSuccess: (order: { id: string; subtotal: number; lines: CartLine[] }) => void;
};

/**
 * The Paystack Inline flow, shared by the retail and wholesale cart drawers — one copy of the
 * already-verified popup → verify → order logic, parameterized by channel.
 */
export function usePaystackCheckout(opts: {
  channel: "retail" | "wholesale";
  lines: CartLine[];
  subtotal: number;
}) {
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);

  const placeOrder = (args: PlaceOrderArgs) => {
    setPaymentError(null);

    if (!window.PaystackPop) {
      setPaymentError("Payment isn't ready yet — please wait a moment and try again.");
      return;
    }

    setPlacingOrder(true);
    const prefix = opts.channel === "wholesale" ? "PAW" : "PA";
    const reference = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
      email: args.email,
      amount: Math.round(opts.subtotal * 100),
      currency: "GHS",
      ref: reference,
      metadata: { channel: opts.channel, customer: args.customer, lines: opts.lines, subtotal: opts.subtotal },
      callback: (response) => {
        (async () => {
          try {
            const res = await fetch("/api/payments/paystack/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channel: opts.channel,
                reference: response.reference,
                customer: args.customer,
                lines: opts.lines,
                subtotal: opts.subtotal,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setPaymentError(data.error || "We couldn't confirm your payment. Please try again.");
              setPlacingOrder(false);
              return;
            }
            setConfirmedOrderId(data.id);
            setPlacingOrder(false);
            args.onSuccess({ id: data.id, subtotal: data.subtotal, lines: data.lines });
          } catch {
            setPaymentError("We couldn't confirm your payment. Please try again.");
            setPlacingOrder(false);
          }
        })();
      },
      onClose: () => setPlacingOrder(false),
    });
    handler.openIframe();
  };

  const reset = () => {
    setConfirmedOrderId(null);
    setPaymentError(null);
  };

  return { placingOrder, paymentError, confirmedOrderId, placeOrder, reset };
}
