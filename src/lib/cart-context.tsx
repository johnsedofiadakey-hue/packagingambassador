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

export type CartLine = {
  slug: string;
  name: string;
  price: number;
  unit: string;
  size: string;
  color: string;
  quantity: number;
};

type CartContextValue = {
  lines: CartLine[];
  addToCart: (product: Product, opts: { size: string; color: string; quantity: number }) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "pa-cart";

function lineKey(line: Pick<CartLine, "slug" | "size" | "color">) {
  return `${line.slug}__${line.size}__${line.color}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

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

  const addToCart = useCallback<CartContextValue["addToCart"]>((product, opts) => {
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
          price: product.price,
          unit: product.unit,
          size: opts.size,
          color: opts.color,
          quantity: opts.quantity,
        },
      ];
    });
  }, []);

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
    () => ({ lines, addToCart, updateQuantity, removeLine, clearCart, itemCount, subtotal }),
    [lines, addToCart, updateQuantity, removeLine, clearCart, itemCount, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { lineKey };
