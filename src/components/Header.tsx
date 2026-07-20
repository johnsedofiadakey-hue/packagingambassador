"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Leaf, Menu, Search, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useAdminData } from "@/lib/store";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const { itemCount } = useCart();
  const { categories } = useAdminData();
  const [open, setOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/8 bg-sand-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sunset-500 text-white">
            <Leaf className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="font-display leading-tight">
            <span className="block text-lg font-bold text-ink-900">Packaging</span>
            <span className="block text-xs font-bold tracking-widest text-amber-600">
              AMBASSADORS
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
          >
            Home
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setShopOpen(true)}
            onMouseLeave={() => setShopOpen(false)}
          >
            <Link
              href="/shop"
              className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
            >
              Shop Collection
              <ChevronDown className="h-3.5 w-3.5" />
            </Link>

            {shopOpen && (
              <div className="absolute left-0 top-full pt-2">
                <div className="w-56 rounded-2xl border border-ink-900/8 bg-sand-50 p-2 shadow-xl shadow-ink-900/10">
                  {categories.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/category/${c.slug}`}
                      className="block rounded-xl px-4 py-2.5 text-sm font-medium text-ink-800 hover:bg-amber-500/10 hover:text-amber-700"
                    >
                      {c.name}
                    </Link>
                  ))}
                  <Link
                    href="/shop"
                    className="mt-1 block rounded-xl px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-500/10"
                  >
                    View All Products
                  </Link>
                </div>
              </div>
            )}
          </div>

          {NAV_LINKS.slice(1).map((link) => (
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
            href="/shop"
            aria-label="Search products"
            className="rounded-full p-2.5 text-ink-800 transition-colors hover:bg-ink-900/5"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="ml-1 flex items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {itemCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-700">
                {itemCount}
              </span>
            )}
          </Link>
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
          <Link
            href="/shop"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink-800 hover:bg-ink-900/5"
          >
            Shop Collection
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 pl-6 text-sm font-medium text-ink-700 hover:bg-ink-900/5"
            >
              {c.name}
            </Link>
          ))}
          {NAV_LINKS.slice(1).map((link) => (
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
