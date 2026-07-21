"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Store, ShoppingCart, PackageSearch } from "lucide-react";
import { useCart } from "@/lib/cart-context";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/track", label: "Track", icon: PackageSearch },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTabBar() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-ink-900/8 bg-sand-50/95 px-2 pt-1.5 shadow-[0_-4px_24px_rgba(36,31,22,0.08)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
          >
            {active && (
              <motion.span
                layoutId="mobileTabIndicator"
                className="absolute inset-x-2 top-0 h-8 rounded-2xl bg-amber-500/15"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <motion.span
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center gap-0.5"
            >
              <span className="relative">
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    active ? "text-amber-600" : "text-ink-700/60"
                  }`}
                  strokeWidth={active ? 2.4 : 2}
                />
                {href === "/cart" && itemCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold leading-none text-white">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] font-medium transition-colors ${
                  active ? "text-amber-600" : "text-ink-700/60"
                }`}
              >
                {label}
              </span>
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
