"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeftRight, Menu, ShoppingCart, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useWholesaleCart } from "@/lib/wholesale-cart-context";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/wholesale", label: "Catalogue" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact Us" },
];

export function WholesaleHeader() {
  const { itemCount, openCart } = useWholesaleCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-all duration-300 ease-out",
        scrolled ? "glass" : "border-transparent bg-sand-300 shadow-none backdrop-blur-none"
      )}
    >
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--color-forest-600), var(--color-amber-500), var(--color-sunset-500))",
        }}
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/wholesale" className="flex items-center gap-2">
          <Logo />
          <span className="font-display leading-tight">
            <span className="block text-lg font-bold text-ink-900">Packaging</span>
            <span className="block text-xs font-bold tracking-widest text-forest-600">
              WHOLESALE
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="hidden items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-900/5 sm:flex"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Retail Store
          </Link>
          <button
            onClick={openCart}
            aria-label="Open wholesale cart"
            className="ml-1 flex items-center gap-2 rounded-full bg-forest-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-700"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-forest-700">
                {itemCount}
              </span>
            )}
          </button>
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2.5 text-ink-800 transition-colors hover:bg-ink-900/5 md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-ink-900/8 px-6 py-3 md:hidden">
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
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-900/5"
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Retail Store
          </Link>
        </nav>
      )}
    </header>
  );
}
