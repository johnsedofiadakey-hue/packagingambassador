"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Store, Building2, ShoppingCart, PackageSearch } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useWholesaleCart } from "@/lib/wholesale-cart-context";

export function MobileTabBar() {
  const pathname = usePathname();
  const retailCart = useCart();
  const wholesaleCart = useWholesaleCart();

  const isWholesalePage = pathname.startsWith("/wholesale");
  const itemCount = isWholesalePage ? wholesaleCart.itemCount : retailCart.itemCount;
  const openCart = isWholesalePage ? wholesaleCart.openCart : retailCart.openCart;

  const TABS = [
    { href: "/", label: "Home", icon: Home },
    { href: "/shop", label: "Shop", icon: Store },
    { href: "/wholesale", label: "Wholesale", icon: Building2 },
    { href: "cart", label: "Cart", icon: ShoppingCart, isCart: true },
    { href: "/track", label: "Track", icon: PackageSearch },
  ] as const;

  return (
    <div className="fixed inset-x-0 bottom-3 z-50 flex justify-center px-4 md:hidden pointer-events-none">
      <nav
        aria-label="Mobile Navigation Dock"
        className="pointer-events-auto flex w-full max-w-sm items-center justify-around rounded-full border border-white/60 bg-white/85 p-1.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] backdrop-blur-2xl transition-all"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {TABS.map((tab) => {
          const { label, icon: Icon } = tab;
          const isCart = "isCart" in tab && tab.isCart;
          const active = !isCart && (tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href));

          const accentColor = isWholesalePage ? "text-forest-700" : "text-amber-600";
          const bgActiveColor = isWholesalePage ? "bg-forest-600/15" : "bg-amber-500/15";
          const badgeBgColor = isWholesalePage ? "bg-forest-600" : "bg-amber-500";

          const inner = (
            <div className="relative flex flex-col items-center justify-center py-1">
              {active && (
                <motion.span
                  layoutId="floatingTabIndicator"
                  className={`absolute inset-x-0 -top-1 bottom-0 rounded-full ${bgActiveColor}`}
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.82 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="relative flex flex-col items-center gap-0.5"
              >
                <span className="relative">
                  <Icon
                    className={`h-5 w-5 transition-colors ${
                      active ? accentColor : "text-ink-700/60"
                    }`}
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  {isCart && itemCount > 0 && (
                    <span className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full ${badgeBgColor} px-1 text-[10px] font-bold leading-none text-white shadow-sm`}>
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-semibold tracking-tight transition-colors ${
                    active ? accentColor : "text-ink-700/70"
                  }`}
                >
                  {label}
                </span>
              </motion.div>
            </div>
          );

          const className = "relative flex flex-1 flex-col items-center justify-center px-1";
          return isCart ? (
            <button key="cart" type="button" onClick={openCart} aria-label="Open cart" className={className}>
              {inner}
            </button>
          ) : (
            <Link key={tab.href} href={tab.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
