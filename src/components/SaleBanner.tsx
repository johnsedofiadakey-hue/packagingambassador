"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminData } from "@/lib/store";

const pad = (n: number) => String(n).padStart(2, "0");

function breakdown(ms: number) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}

/**
 * Sitewide flash-sale banner with a live countdown. Distinct from PromoBar (a plain
 * announcement) — this is time-bound and auto-hides the moment the sale ends, so a
 * store owner can schedule a sale and forget it. The per-product sale prices ride on
 * the existing `compareAtPrice` discount system; this is the sitewide signal for it.
 */
export function SaleBanner() {
  const { settings } = useAdminData();
  const sale = settings.sale;

  // Time is computed client-side only (after mount) to avoid an SSR/CSR mismatch.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!sale.enabled || sale.headline.trim().length === 0) return null;

  const endMs = sale.endsAt ? new Date(sale.endsAt).getTime() : NaN;
  const hasTimer = Number.isFinite(endMs);
  if (hasTimer && now !== null && endMs - now <= 0) return null; // sale is over

  const t = hasTimer && now !== null ? breakdown(endMs - now) : null;

  return (
    <div
      className="text-white"
      style={{
        backgroundImage:
          "linear-gradient(90deg, var(--color-sunset-500), var(--color-amber-500), var(--color-sunset-500))",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-6 py-2.5 text-center text-sm font-semibold">
        <span>{sale.headline}</span>
        {t && (
          <span className="tabular-nums">
            Ends in {t.d > 0 ? `${t.d}d ` : ""}
            {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
          </span>
        )}
        {sale.ctaLabel && sale.ctaHref && (
          <Link
            href={sale.ctaHref}
            className="rounded-full bg-white/20 px-3 py-0.5 transition-colors hover:bg-white/30"
          >
            {sale.ctaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
