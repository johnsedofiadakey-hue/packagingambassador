"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingCart, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";

// Deliberately lean — everything else (Shop, About, Contact, Track Order) lives in the
// footer so the top nav stays uncluttered. Search + Cart cover the primary storefront actions.
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/wholesale", label: "Wholesale" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  // Over the full-screen homepage hero: transparent header, white text, until you scroll.
  const overlay = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls = overlay
    ? "text-white/85 hover:bg-white/10 hover:text-white"
    : "text-ink-800 hover:bg-ink-900/5";
  const iconCls = overlay
    ? "text-white hover:bg-white/10"
    : "text-ink-800 hover:bg-ink-900/5";

  return (
    <header
      className={cn(
        "z-40 border-b transition-all duration-300 ease-out",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        overlay
          ? "border-transparent bg-transparent"
          : scrolled
            ? "glass"
            : "border-transparent bg-sand-300 shadow-none backdrop-blur-none"
      )}
    >
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-amber-500), var(--color-sunset-500), var(--color-clay-700), var(--color-forest-600))",
        }}
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-display leading-tight">
            <span className={cn("block text-lg font-bold", overlay ? "text-white" : "text-ink-900")}>
              Packaging
            </span>
            <span
              className={cn(
                "block text-xs font-bold tracking-widest",
                overlay ? "text-amber-300" : "text-amber-600"
              )}
            >
              AMBASSADORS
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.filter((l) => l.href === "/" || l.href === "/wholesale").map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-colors", linkCls)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/shop"
            aria-label="Search products"
            className={cn("rounded-full p-2.5 transition-colors", iconCls)}
          >
            <Search className="h-5 w-5" />
          </Link>
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="ml-1 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-700">
                {itemCount}
              </span>
            )}
          </button>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className={cn("rounded-full p-2.5 transition-colors md:hidden", iconCls)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="glass flex flex-col gap-1 border-t border-ink-900/8 px-6 py-3 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-900/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
