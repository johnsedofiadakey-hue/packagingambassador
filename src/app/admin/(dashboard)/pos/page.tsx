"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Minus, Plus, Trash2, Receipt, CheckCircle2, X } from "lucide-react";
import { useAdminData } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { formatPrice, cn, normalizeSizes, sizePrice } from "@/lib/utils";
import type { CartLine } from "@/lib/cart-context";
import { PageLoading } from "@/components/PageLoading";

type Channel = "retail" | "wholesale";
type PaymentMethod = "pos-cash" | "pos-momo" | "pos-card";

const PAYMENTS: { id: PaymentMethod; label: string }[] = [
  { id: "pos-cash", label: "Cash" },
  { id: "pos-momo", label: "MoMo" },
  { id: "pos-card", label: "Card" },
];

export default function POSPage() {
  const { products, loading } = useAdminData();
  const [channel, setChannel] = useState<Channel>("retail");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pos-cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false); // mobile cart sheet

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (channel === "wholesale") result = result.filter((p) => p.wholesalePrice !== undefined);
    return result;
  }, [products, search, channel]);

  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);
  const qtyInCart = (slug: string) => cart.filter((i) => i.slug === slug).reduce((s, i) => s + i.quantity, 0);

  const handleAddToCart = (product: (typeof products)[number]) => {
    const defaultSize = normalizeSizes(product.sizes)[0]?.name || "Standard";
    const defaultColor = product.colors?.[0]?.name || "Default";
    const price = sizePrice(product, defaultSize, channel === "wholesale" ? "wholesale" : "retail");
    setCart((prev) => {
      const idx = prev.findIndex(
        (i) => i.slug === product.slug && i.size === defaultSize && i.color === defaultColor
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [
        ...prev,
        {
          slug: product.slug,
          name: product.name,
          image: product.image,
          price,
          unit: product.unit,
          size: defaultSize,
          color: defaultColor,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (index: number, delta: number) =>
    setCart((prev) => {
      const next = [...prev];
      const item = { ...next[index] };
      if (item.quantity + delta > 0) {
        item.quantity += delta;
        next[index] = item;
        return next;
      }
      next.splice(index, 1);
      return next;
    });

  const removeItem = (index: number) =>
    setCart((prev) => prev.filter((_, i) => i !== index));

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/orders/pos", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          channel,
          customer: { name: customerName, phone: customerPhone },
          lines: cart,
          subtotal,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) setSuccessOrderId(data.orderId);
      else alert("Failed to process sale");
    } catch (err) {
      console.error(err);
      alert("Error processing sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPOS = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setPaymentMethod("pos-cash");
    setSuccessOrderId(null);
    setCartOpen(false);
  };

  if (loading) return <PageLoading />;

  const inputCls =
    "w-full rounded-xl border border-ink-900/10 bg-cream-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  // Shared cart body — used in the desktop side panel and the mobile sheet.
  const cartBody = (
    <div className="relative flex h-full flex-col">
      {successOrderId && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-cream-50 p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-forest-600/10 text-forest-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="mb-1 font-display text-2xl font-bold text-ink-900">Sale Complete</h2>
          <p className="mb-8 text-sm text-ink-700">Order {successOrderId}</p>
          <div className="flex w-full flex-col gap-3">
            <button
              onClick={() => window.open(`/admin/pos/receipt/${successOrderId}`, "_blank")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 py-4 font-semibold text-white hover:bg-ink-800"
            >
              <Receipt className="h-4 w-4" /> Print Receipt
            </button>
            <button
              onClick={resetPOS}
              className="w-full rounded-2xl border border-ink-900/10 bg-white py-4 font-semibold text-ink-900 hover:bg-ink-900/5"
            >
              New Sale
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-40 flex-col items-center justify-center text-ink-700/50">
            <ShoppingCart className="mb-2 h-12 w-12 opacity-50" />
            <p>No items yet — tap products to add.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-ink-900/5 bg-white p-3">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                    <p className="text-xs text-ink-700/60">
                      {item.size} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(idx)}
                    aria-label="Remove"
                    className="rounded-full p-2 text-red-500/70 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-full border border-ink-900/10 bg-cream-50">
                    <button onClick={() => updateQuantity(idx, -1)} className="p-2.5 hover:text-amber-600" aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(idx, 1)} className="p-2.5 hover:text-amber-600" aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-ink-900">{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-ink-900/10 bg-white p-4">
        <input
          type="text"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={inputCls}
        />
        <input
          type="tel"
          placeholder="Customer phone (optional)"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className={inputCls}
        />
        <div className="flex gap-2">
          {PAYMENTS.map((m) => (
            <button
              key={m.id}
              onClick={() => setPaymentMethod(m.id)}
              className={cn(
                "flex-1 rounded-xl border py-3 text-sm font-semibold transition-colors",
                paymentMethod === m.id
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-900/10 bg-cream-50 text-ink-700 hover:border-ink-900/30"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <div>
            <p className="text-xs text-ink-700">Subtotal</p>
            <p className="font-display text-2xl font-bold text-ink-900">{formatPrice(subtotal)}</p>
          </div>
        </div>
        <button
          onClick={handleCompleteSale}
          disabled={cart.length === 0 || isSubmitting}
          className="w-full rounded-2xl bg-forest-600 py-4 text-base font-semibold text-white transition-colors hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Processing…" : `Complete Sale · ${formatPrice(subtotal)}`}
        </button>
      </div>
    </div>
  );

  return (
    <div className="lg:flex lg:h-[calc(100dvh-6rem)] lg:gap-4">
      {/* Products */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Sticky controls */}
        <div className="sticky top-14 z-20 -mx-4 mb-3 space-y-3 bg-sand-100/95 px-4 py-2 backdrop-blur md:top-0 md:mx-0 md:rounded-2xl md:px-3">
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-ink-900/10 bg-white p-1">
              {(["retail", "wholesale"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
                    channel === c ? "bg-amber-500 text-white" : "text-ink-700"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
            {/* Mobile cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="ml-auto flex items-center gap-2 rounded-full bg-forest-600 px-4 py-2 text-sm font-semibold text-white lg:hidden"
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 ? `${cartCount} · ${formatPrice(subtotal)}` : "Cart"}
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/50" />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-ink-900/10 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:overflow-y-auto lg:pr-1 xl:grid-cols-4">
          {filteredProducts.map((product) => {
            const price = sizePrice(
              product,
              normalizeSizes(product.sizes)[0]?.name ?? "",
              channel === "wholesale" ? "wholesale" : "retail"
            );
            const inCart = qtyInCart(product.slug);
            return (
              <button
                key={product.slug}
                onClick={() => handleAddToCart(product)}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-900/5 bg-white text-left transition-all active:scale-[0.98] hover:border-amber-500/40 hover:shadow-md"
              >
                {inCart > 0 && (
                  <span className="absolute right-2 top-2 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-forest-600 px-1.5 text-xs font-bold text-white shadow">
                    {inCart}
                  </span>
                )}
                <div className="relative aspect-square w-full overflow-hidden bg-sand-100">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-ink-700/20">
                      <ShoppingCart className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="line-clamp-1 text-sm font-semibold text-ink-900">{product.name}</h3>
                  <p className="mt-0.5 text-xs text-ink-700/60">{product.stock} in stock</p>
                  <p className="mt-1.5 font-display text-base font-bold text-ink-900">{formatPrice(price)}</p>
                </div>
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-ink-700/50">No products found.</p>
          )}
        </div>
      </div>

      {/* Desktop cart panel */}
      <div className="hidden w-96 shrink-0 overflow-hidden rounded-2xl border border-cream-200 bg-cream-50 shadow-sm lg:flex lg:flex-col">
        <div className="border-b border-ink-900/10 bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
            <ShoppingCart className="h-5 w-5" /> Current Sale
          </h2>
        </div>
        {cartBody}
      </div>

      {/* Mobile cart sheet */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 top-14 flex flex-col overflow-hidden rounded-t-3xl bg-cream-50">
            <div className="flex items-center justify-between border-b border-ink-900/10 bg-white px-4 py-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink-900">
                <ShoppingCart className="h-5 w-5" /> Current Sale
              </h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close" className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1">{cartBody}</div>
          </div>
        </div>
      )}
    </div>
  );
}
