"use client";

import { useEffect, useState } from "react";

/**
 * Full-bleed hero backdrop. Crossfades admin-uploaded slides, or falls back to a deep,
 * warm brand gradient when there are none — so the hero is never empty. A scrim keeps the
 * white hero text legible over either.
 */
export function HeroSlider({ slides = [] }: { slides?: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [slides.length]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {slides.length === 0 ? (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-forest-950 to-clay-700">
          <div className="animate-drift-a absolute -left-32 -top-24 h-[32rem] w-[32rem] rounded-full bg-amber-500/25 blur-3xl" />
          <div className="animate-drift-b absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-forest-500/20 blur-3xl" />
          <div className="animate-drift-c absolute -bottom-24 left-1/3 h-[26rem] w-[26rem] rounded-full bg-sunset-500/20 blur-3xl" />
        </div>
      ) : (
        slides.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      )}
      {/* Scrim — darker at the left/bottom where the copy sits. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/35 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
    </div>
  );
}
