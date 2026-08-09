"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, CheckCircle2, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart, lineKey, type CartLine } from "@/lib/cart-context";
import { useWholesaleCart } from "@/lib/wholesale-cart-context";
import { useAdminData, type StoreSettings } from "@/lib/store";
import { usePaystackCheckout } from "@/lib/use-paystack-checkout";
import { formatPrice, cn } from "@/lib/utils";

type CartApi = {
  lines: CartLine[];
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  closeCart: () => void;
};

const emptyDetails = {
  name: "",
  phone: "",
  email: "",
  address: "",
  businessName: "",
  contactName: "",
  deliveryAddress: "",
  billingAddress: "",
};

function CartDrawerView({
  channel,
  cart,
  settings,
}: {
  channel: "retail" | "wholesale";
  cart: CartApi;
  settings: StoreSettings;
}) {
  const isWholesale = channel === "wholesale";
  const { lines, updateQuantity, removeLine, clearCart, subtotal, itemCount, isOpen, closeCart } = cart;
  const [checkingOut, setCheckingOut] = useState(false);
  const [details, setDetails] = useState(emptyDetails);
  const [paymentMethod, setPaymentMethod] = useState<"paystack" | "invoice">("paystack");
  const checkout = usePaystackCheckout({ channel, lines, subtotal });
  
  // Local state for invoice checkout success
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | null>(null);
  const [isPlacingInvoice, setIsPlacingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  
  const confirmedId = checkout.confirmedOrderId || invoiceOrderId;

  const locked = isWholesale ? settings.wholesaleCheckoutLocked : settings.checkoutLocked;
  const lockMessage = isWholesale ? settings.wholesaleCheckoutLockMessage : settings.checkoutLockMessage;
  const shopHref = isWholesale ? "/wholesale" : "/shop";
  const accentBtn = isWholesale
    ? "bg-forest-600 hover:bg-forest-700"
    : "bg-amber-500 hover:bg-amber-600";
  const inputFocus = isWholesale
    ? "focus:border-forest-600 focus-visible:ring-forest-600/40"
    : "focus:border-amber-500 focus-visible:ring-amber-500/40";
  const input = `w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus-visible:ring-2 ${inputFocus}`;

  const handleClose = () => {
    closeCart();
    if (confirmedId) {
      checkout.reset();
      setInvoiceOrderId(null);
      setCheckingOut(false);
      setPaymentMethod("paystack");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = isWholesale
      ? {
          businessName: details.businessName,
          contactName: details.contactName,
          phone: details.phone,
          email: details.email || undefined,
          deliveryAddress: details.deliveryAddress,
          billingAddress: details.billingAddress || details.deliveryAddress,
        }
      : { name: details.name, phone: details.phone, email: details.email || undefined, address: details.address };

    if (isWholesale && paymentMethod === "invoice") {
      setIsPlacingInvoice(true);
      setInvoiceError(null);
      try {
        const res = await fetch("/api/orders/wholesale/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            lines,
            subtotal,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setInvoiceError(data.error || "Failed to place order.");
          setIsPlacingInvoice(false);
          return;
        }
        setInvoiceOrderId(data.id);
        setIsPlacingInvoice(false);
        clearCart();
        setCheckingOut(false);
        fetch("/api/notifications/order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data.id,
            customerName: details.contactName,
            phone: details.phone,
            email: details.email || undefined,
            subtotal: data.subtotal,
            lines: data.lines,
            smsSenderId: settings.smsSenderId,
            emailFromAddress: settings.emailFromAddress,
            storeEmail: settings.storeEmail,
            storeName: settings.storeName,
            storePhone: settings.storePhone,
            storeAddress: settings.storeAddress,
            theme: settings.theme,
          }),
        }).catch(() => {});
      } catch {
        setInvoiceError("Failed to place order. Please try again.");
        setIsPlacingInvoice(false);
      }
      return;
    }

    checkout.placeOrder({
      email: details.email,
      customer,
      onSuccess: (order) => {
        clearCart();
        setCheckingOut(false);
        fetch("/api/notifications/order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            customerName: isWholesale ? details.contactName : details.name,
            phone: details.phone,
            email: details.email || undefined,
            subtotal: order.subtotal,
            lines: order.lines,
            smsSenderId: settings.smsSenderId,
            emailFromAddress: settings.emailFromAddress,
            storeEmail: settings.storeEmail,
            storeName: settings.storeName,
            storePhone: settings.storePhone,
            storeAddress: settings.storeAddress,
            theme: settings.theme,
          }),
        }).catch(() => {
          // Best-effort — the order is already placed regardless of notification delivery.
        });
      },
    });
  };

  const set = (patch: Partial<typeof emptyDetails>) => setDetails((d) => ({ ...d, ...patch }));

  return (
    <div className={cn("fixed inset-0 z-[60]", isOpen ? "" : "pointer-events-none")} aria-hidden={!isOpen}>
      <div
        onClick={handleClose}
        className={cn(
          "absolute inset-0 bg-ink-900/40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-label={isWholesale ? "Wholesale cart" : "Cart"}
        className={cn(
          "absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-cream-50 shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {confirmedId ? "Order Placed" : isWholesale ? "Wholesale Cart" : "Your Cart"}
            {!confirmedId && itemCount > 0 && (
              <span className="ml-2 text-sm font-normal text-ink-700/60">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            )}
          </h2>
          <button onClick={handleClose} aria-label="Close cart" className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-forest-800/10 text-forest-800">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-ink-900">Payment received</h3>
              <p className="mt-1 text-sm text-ink-700/70">
                We&apos;ll reach out to confirm delivery details.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/60">Tracking number</p>
              <p className="mt-1 font-display text-xl font-bold tracking-wide text-ink-900">
                {confirmedId}
              </p>
            </div>
            <div className="mt-2 flex w-full flex-col gap-3">
              {isWholesale && (
                <div className="flex w-full gap-2 mb-2">
                  <a
                    href={`/wholesale/invoice/${confirmedId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-cream-100"
                  >
                    Invoice
                  </a>
                  <a
                    href={`/wholesale/waybill/${confirmedId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-xl border border-ink-900/15 bg-white px-4 py-2 text-sm font-semibold text-ink-900 hover:bg-cream-100"
                  >
                    Waybill
                  </a>
                </div>
              )}
              <Link
                href={`/track?order=${confirmedId}`}
                onClick={handleClose}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink-900/15 px-6 py-3 font-semibold text-ink-900 hover:border-amber-500 hover:text-amber-600"
              >
                Track Your Order
              </Link>
              <button
                onClick={handleClose}
                className={cn("inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold text-white", accentBtn)}
              >
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-100 text-ink-700/40">
              <ShoppingBag className="h-8 w-8" strokeWidth={1.5} />
            </span>
            <p className="text-ink-700/70">Your cart is empty.</p>
            <Link
              href={shopHref}
              onClick={handleClose}
              className={cn("inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white", accentBtn)}
            >
              Start Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="divide-y divide-cream-200">
                {lines.map((line) => {
                  const key = lineKey(line);
                  return (
                    <li key={key} className="flex items-center gap-3 py-4">
                      {line.image ? (
                        <img
                          src={line.image}
                          alt={line.name}
                          className="h-12 w-12 shrink-0 rounded-xl border border-cream-200 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-cream-200 bg-cream-100 text-xs text-ink-700/40">
                          —
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-sm font-semibold text-ink-900">{line.name}</p>
                        <p className="text-xs text-ink-700/70">
                          {line.color} · {line.size} · {formatPrice(line.price)}
                        </p>
                      </div>
                      <div className="flex items-center rounded-full border border-cream-200">
                        <button
                          onClick={() => updateQuantity(key, line.quantity - 1)}
                          className="p-2 text-ink-800 hover:text-amber-600 sm:p-1.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                        <button
                          onClick={() => updateQuantity(key, line.quantity + 1)}
                          className="p-2 text-ink-800 hover:text-amber-600 sm:p-1.5"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="w-16 text-right text-xs font-semibold text-ink-900 sm:w-20 sm:text-sm">
                        {formatPrice(line.price * line.quantity)}
                      </p>
                      <button
                        onClick={() => removeLine(key)}
                        aria-label="Remove item"
                        className="rounded-full p-2 text-ink-700/40 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="border-t border-cream-200 bg-cream-50 px-5 py-4">
              <div className="flex justify-between font-display text-lg font-bold text-ink-900">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-ink-700/50">Delivery calculated at checkout.</p>

              {locked ? (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-ink-800">
                  {lockMessage}
                </p>
              ) : isWholesale && itemCount < settings.wholesaleMOQ ? (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-800">
                  Wholesale requires a minimum of {settings.wholesaleMOQ} items total.
                </p>
              ) : !checkingOut ? (
                <button
                  onClick={() => setCheckingOut(true)}
                  className={cn("mt-4 w-full rounded-full py-3 font-semibold text-white", accentBtn)}
                >
                  Checkout
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
                  <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
                  {isWholesale ? (
                    <>
                      <input required placeholder="Business name" value={details.businessName} onChange={(e) => set({ businessName: e.target.value })} className={input} />
                      <input required placeholder="Contact name" value={details.contactName} onChange={(e) => set({ contactName: e.target.value })} className={input} />
                    </>
                  ) : (
                    <input required placeholder="Full name" value={details.name} onChange={(e) => set({ name: e.target.value })} className={input} />
                  )}
                  <input required type="tel" placeholder="Phone number" value={details.phone} onChange={(e) => set({ phone: e.target.value })} className={input} />
                  <input required type="email" placeholder="Email" value={details.email} onChange={(e) => set({ email: e.target.value })} className={input} />
                  <textarea
                    required
                    rows={2}
                    placeholder="Delivery address"
                    value={isWholesale ? details.deliveryAddress : details.address}
                    onChange={(e) => set(isWholesale ? { deliveryAddress: e.target.value } : { address: e.target.value })}
                    className={input}
                  />
                  {isWholesale && (
                    <>
                      <textarea
                        rows={2}
                        placeholder="Billing address (if different)"
                        value={details.billingAddress}
                        onChange={(e) => set({ billingAddress: e.target.value })}
                        className={input}
                      />
                      <div className="mt-2 flex gap-4 rounded-xl border border-cream-200 bg-white p-3 text-sm">
                        <label className="flex flex-1 items-center gap-2 font-medium">
                          <input type="radio" checked={paymentMethod === "paystack"} onChange={() => setPaymentMethod("paystack")} className="h-4 w-4 text-forest-600" />
                          Pay Online
                        </label>
                        <label className="flex flex-1 items-center gap-2 font-medium">
                          <input type="radio" checked={paymentMethod === "invoice"} onChange={() => setPaymentMethod("invoice")} className="h-4 w-4 text-forest-600" />
                          Invoice (Cash/Transfer)
                        </label>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-ink-700/50">
                    {paymentMethod === "paystack" ? "You'll pay securely via Paystack. Your order is confirmed once payment succeeds." : "We will generate an invoice for your order."}
                  </p>
                  {checkout.paymentError && <p className="text-xs font-medium text-red-600">{checkout.paymentError}</p>}
                  {invoiceError && <p className="text-xs font-medium text-red-600">{invoiceError}</p>}
                  <button
                    type="submit"
                    disabled={checkout.placingOrder || isPlacingInvoice}
                    className={cn("w-full rounded-full py-3 font-semibold text-white disabled:opacity-60", accentBtn)}
                  >
                    {checkout.placingOrder || isPlacingInvoice ? "Processing…" : paymentMethod === "paystack" ? `Pay ${formatPrice(subtotal)}` : "Place Wholesale Order"}
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CartDrawer() {
  const cart = useCart();
  const { settings } = useAdminData();
  return <CartDrawerView channel="retail" cart={cart} settings={settings} />;
}

export function WholesaleCartDrawer() {
  const cart = useWholesaleCart();
  const { settings } = useAdminData();
  const api: CartApi = {
    lines: cart.lines,
    updateQuantity: cart.updateQuantity,
    removeLine: cart.removeLine,
    clearCart: cart.clearCart,
    subtotal: cart.subtotal,
    itemCount: cart.itemCount,
    isOpen: cart.isOpen,
    closeCart: cart.closeCart,
  };
  return <CartDrawerView channel="wholesale" cart={api} settings={settings} />;
}
