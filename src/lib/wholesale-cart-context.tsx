"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "@/lib/products";
import type { CartLine } from "@/lib/cart-context";
import { lineKey } from "@/lib/cart-context";

type WholesaleCartContextValue = {
  lines: CartLine[];
  addToWholesaleCart: (product: Product, opts: { size: string; color: string; quantity: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const WholesaleCartContext = createContext<WholesaleCartContextValue | null>(null);
const STORAGE_KEY = "pa-wholesale-cart";

/**
 * Deliberate near-duplicate of CartProvider (src/lib/cart-context.tsx), not a shared
 * implementation — a separate localStorage key and a separate context instance are the whole
 * point: retail and wholesale carts must never be able to cross-contaminate.
 */
export function WholesaleCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time localStorage hydration on mount
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addToWholesaleCart = useCallback<WholesaleCartContextValue["addToWholesaleCart"]>(
    (product, opts) => {
      setIsOpen(true);
      setLines((prev) => {
        const key = lineKey({ slug: product.slug, size: opts.size, color: opts.color });
        const existing = prev.find((l) => lineKey(l) === key);
        if (existing) {
          return prev.map((l) =>
            lineKey(l) === key ? { ...l, quantity: l.quantity + opts.quantity } : l
          );
        }
        return [
          ...prev,
          {
            slug: product.slug,
            name: product.name,
            image: product.image || undefined,
            price: product.wholesalePrice ?? product.price,
            unit: product.unit,
            size: opts.size,
            color: opts.color,
            quantity: opts.quantity,
          },
        ];
      });
    },
    []
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => lineKey(l) !== key)
        : prev.map((l) => (lineKey(l) === key ? { ...l, quantity } : l))
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);

  const clearCart = useCallback(() => {
    setLines([]);
  }, []);

  const itemCount = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    [lines]
  );

  const value = useMemo(
    () => ({ lines, addToWholesaleCart, updateQuantity, removeLine, clearCart, itemCount, subtotal, isOpen, openCart, closeCart }),
    [lines, addToWholesaleCart, updateQuantity, removeLine, clearCart, itemCount, subtotal, isOpen, openCart, closeCart]
  );

  return <WholesaleCartContext.Provider value={value}>{children}</WholesaleCartContext.Provider>;
}

export function useWholesaleCart() {
  const ctx = useContext(WholesaleCartContext);
  if (!ctx) throw new Error("useWholesaleCart must be used within WholesaleCartProvider");
  return ctx;
}
