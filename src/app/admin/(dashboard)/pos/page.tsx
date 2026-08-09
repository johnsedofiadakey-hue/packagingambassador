"use client";

import { useState, useMemo } from "react";
import { Search, ShoppingCart, Minus, Plus, Trash2, Receipt, CheckCircle2 } from "lucide-react";
import { useAdminData } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { formatPrice, cn, normalizeSizes, sizePrice } from "@/lib/utils";
import type { CartLine } from "@/lib/cart-context";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import Image from "next/image";

type Channel = "retail" | "wholesale";
type PaymentMethod = "pos-cash" | "pos-momo" | "pos-card";

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

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (channel === "wholesale") {
      // Filter out products without wholesale pricing if needed, or we just rely on falling back to retail price
      result = result.filter(p => p.wholesalePrice !== undefined);
    }
    return result;
  }, [products, search, channel]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: any) => {
    const defaultSize = normalizeSizes(product.sizes)[0]?.name || "Standard";
    const defaultColor = product.colors?.[0]?.name || "Default";
    const price = sizePrice(product, defaultSize, channel === "wholesale" ? "wholesale" : "retail");
    
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.slug === product.slug && item.size === defaultSize && item.color === defaultColor
      );
      if (existingIdx >= 0) {
        const newCart = [...prev];
        newCart[existingIdx].quantity += 1;
        return newCart;
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
        }
      ];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      if (item.quantity + delta > 0) {
        item.quantity += delta;
      } else {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const removeItem = (index: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      return newCart;
    });
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/orders/pos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          channel,
          customer: { name: customerName, phone: customerPhone },
          lines: cart,
          subtotal,
          paymentMethod
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessOrderId(data.orderId);
      } else {
        alert("Failed to process sale");
      }
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
  };

  if (loading) return <PageLoading />;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <AdminPageHeader title="Point of Sale" description="Process in-person orders" />
      
      <div className="flex flex-1 gap-6 overflow-hidden mt-4 pb-8">
        {/* Left Side: Products Grid */}
        <div className="w-2/3 flex flex-col bg-cream-50 rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-ink-900/10 flex gap-4 items-center">
            <div className="flex bg-ink-900/5 rounded-full p-1 border border-ink-900/10">
              <button
                onClick={() => setChannel("retail")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  channel === "retail" ? "bg-amber-500 text-white" : "text-ink-700 hover:text-ink-900"
                )}
              >
                Retail
              </button>
              <button
                onClick={() => setChannel("wholesale")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-colors",
                  channel === "wholesale" ? "bg-amber-500 text-white" : "text-ink-700 hover:text-ink-900"
                )}
              >
                Wholesale
              </button>
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-700/50" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white rounded-full border border-ink-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => {
                const price = sizePrice(
                  product,
                  normalizeSizes(product.sizes)[0]?.name ?? "",
                  channel === "wholesale" ? "wholesale" : "retail"
                );

                return (
                  <button
                    key={product.slug}
                    onClick={() => handleAddToCart(product)}
                    className="flex flex-col text-left bg-white rounded-xl border border-ink-900/5 overflow-hidden hover:border-amber-500/30 hover:shadow-md transition-all group"
                  >
                    <div className="aspect-square bg-sand-100 relative w-full overflow-hidden">
                      {product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-700/20">
                          <ShoppingCart className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-ink-900 line-clamp-1 group-hover:text-amber-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-xs text-ink-700/60 mt-0.5">{product.stock} in stock</p>
                      <p className="text-sm font-bold text-ink-900 mt-2">{formatPrice(price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Cart Panel */}
        <div className="w-1/3 flex flex-col bg-cream-50 rounded-2xl border border-cream-200 overflow-hidden shadow-sm relative">
          {successOrderId ? (
            <div className="absolute inset-0 bg-cream-50 flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="w-16 h-16 bg-forest-600/10 rounded-full flex items-center justify-center text-forest-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-display font-bold text-ink-900 mb-2">Sale Complete</h2>
              <p className="text-ink-700 mb-8">Order ID: {successOrderId}</p>
              
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => window.open(`/admin/pos/receipt/${successOrderId}`, "_blank")}
                  className="w-full py-3 bg-ink-900 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors"
                >
                  <Receipt className="w-4 h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={resetPOS}
                  className="w-full py-3 bg-white border border-ink-900/10 text-ink-900 rounded-xl font-semibold hover:bg-ink-900/5 transition-colors"
                >
                  New Sale
                </button>
              </div>
            </div>
          ) : null}

          <div className="p-4 border-b border-ink-900/10 bg-white">
            <h2 className="text-lg font-display font-bold text-ink-900 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Current Sale
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-ink-700/50">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-50" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex flex-col bg-white p-3 rounded-xl border border-ink-900/5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                      <p className="text-xs text-ink-700/60">{formatPrice(item.price)}</p>
                    </div>
                    <button 
                      onClick={() => removeItem(idx)}
                      className="text-red-500/70 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-cream-50 rounded-full px-2 py-1 border border-ink-900/5">
                      <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:text-amber-600 transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:text-amber-600 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-ink-900">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-white border-t border-ink-900/10 flex flex-col gap-4">
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 rounded-lg border border-ink-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <input 
                type="tel" 
                placeholder="Customer Phone (Optional)"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-cream-50 rounded-lg border border-ink-900/10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>
            
            <div className="flex gap-2">
              {[
                { id: "pos-cash", label: "Cash" },
                { id: "pos-momo", label: "MoMo" },
                { id: "pos-card", label: "Card" }
              ].map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={cn(
                    "flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors",
                    paymentMethod === method.id 
                      ? "bg-ink-900 text-white border-ink-900" 
                      : "bg-cream-50 text-ink-700 border-ink-900/10 hover:border-ink-900/30"
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-end pt-2">
              <div>
                <p className="text-sm text-ink-700">Subtotal</p>
                <p className="text-2xl font-bold font-display text-ink-900">{formatPrice(subtotal)}</p>
              </div>
              <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isSubmitting}
                className="px-6 py-3 bg-forest-600 text-white rounded-xl font-semibold hover:bg-forest-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
