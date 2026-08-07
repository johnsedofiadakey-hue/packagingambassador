"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, Lock, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Reveal } from "@/components/Reveal";
import { useAdminData } from "@/lib/store";

const SHOP_LINKS = [
  { href: "/category/cups", label: "Cups" },
  { href: "/category/boxes", label: "Boxes" },
  { href: "/category/bags", label: "Bags" },
  { href: "/shop", label: "All Products" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
  { href: "/blog", label: "Blog" },
  { href: "/track", label: "Track Order" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1 text-sm text-cream-100/70 transition-colors hover:text-white"
      >
        <span className="relative">
          {label}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-amber-400 transition-all duration-300 group-hover:w-full" />
        </span>
        <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </Link>
    </li>
  );
}

export function Footer() {
  const { settings } = useAdminData();

  return (
    <footer className="px-4 pb-6 pt-12 sm:px-6">
      {/* Floating glass card — detached from the page edges so it reads as its own surface. */}
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-ink-950/40">
        {/* Living, colourful backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-br from-forest-950 via-forest-900 to-ink-950"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-drift-a absolute -left-20 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="animate-drift-b absolute -right-16 top-8 h-64 w-64 rounded-full bg-forest-500/25 blur-3xl" />
          <div className="animate-drift-c absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-sunset-500/15 blur-3xl" />
          <div className="animate-drift-a absolute bottom-0 right-1/4 h-56 w-56 rounded-full bg-clay-700/20 blur-3xl" />
        </div>

        {/* Animated gradient accent line */}
        <div
          aria-hidden
          className="animate-gradient-pan relative h-1 w-full"
          style={{
            backgroundImage:
              "linear-gradient(90deg, var(--color-amber-500), var(--color-sunset-500), var(--color-clay-700), var(--color-forest-600), var(--color-amber-500))",
          }}
        />

        <div className="relative">
          <div className="mx-auto grid gap-10 px-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
            <Reveal>
              <Link href="/" className="flex items-center gap-2">
                <Logo className="animate-float-soft h-10 rounded-xl bg-white/90 p-1 shadow-lg shadow-black/20" />
                <span className="font-display text-lg font-bold text-white">Packaging Ambassadors</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm text-cream-100/70">
                {settings.pageContent.footerTagline}
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-400">
                Shop
              </h4>
              <ul className="mt-4 space-y-2.5">
                {SHOP_LINKS.map((l) => (
                  <FooterLink key={l.href} {...l} />
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.1}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-400">
                Company
              </h4>
              <ul className="mt-4 space-y-2.5">
                {COMPANY_LINKS.map((l) => (
                  <FooterLink key={l.href} {...l} />
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.15}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-widest text-amber-400">
                Get in Touch
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-cream-100/80">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {settings.storeAddress || "Accra, Ghana"}
                </li>
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <a href={`tel:${settings.storePhone}`} className="transition-colors hover:text-white">
                    {settings.storePhone || "+233 XX XXX XXXX"}
                  </a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <a href={`mailto:${settings.storeEmail}`} className="break-all transition-colors hover:text-white">
                    {settings.storeEmail || "hello@packagingambassadors.com"}
                  </a>
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-8 py-5 text-center text-xs text-cream-100/60 sm:flex-row sm:text-left">
            <span>
              © {new Date().getFullYear()} Packaging Ambassadors. Born in Ghana. Built for businesses.
            </span>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-semibold text-cream-100/80 transition-colors hover:border-amber-400/50 hover:bg-white/10 hover:text-white"
            >
              <Lock className="h-3.5 w-3.5" />
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
