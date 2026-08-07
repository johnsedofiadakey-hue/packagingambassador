"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Full-bleed hero backdrop. Precedence: a background video, else crossfading admin-uploaded
 * slides, else a deep warm brand gradient — so the hero is never empty. The gradient always
 * renders underneath as the base layer, so a slow-loading or failed video/image never leaves
 * a blank hero. A scrim keeps the white hero text legible over any of them.
 */
export function HeroSlider({ videoUrl = "", slides = [] }: { videoUrl?: string; slides?: string[] }) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVideo = videoUrl.trim().length > 0;
  const showSlides = !hasVideo && slides.length > 0;

  useEffect(() => {
    if (hasVideo || slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5500);
    return () => clearInterval(id);
  }, [hasVideo, slides.length]);

  // Pause the background video once the hero scrolls out of view — a playing video keeps
  // decoding and eats GPU/CPU even off-screen, which shows up as scroll jank further down
  // the page. Resume when it scrolls back in.
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) vid.play().catch(() => {});
        else vid.pause();
      },
      { threshold: 0.05 }
    );
    io.observe(vid);
    return () => io.disconnect();
  }, [hasVideo]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Base layer — always present so the hero is never blank. */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-950 via-forest-950 to-clay-700">
        <div className="animate-drift-a absolute -left-32 -top-24 h-[32rem] w-[32rem] rounded-full bg-amber-500/25 blur-3xl" />
        <div className="animate-drift-b absolute -right-24 top-10 h-[28rem] w-[28rem] rounded-full bg-forest-500/20 blur-3xl" />
        <div className="animate-drift-c absolute -bottom-24 left-1/3 h-[26rem] w-[26rem] rounded-full bg-sunset-500/20 blur-3xl" />
      </div>

      {hasVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      )}

      {showSlides &&
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
        ))}
      {/* Scrim — darker at the left/bottom where the copy sits. */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/70 via-ink-950/35 to-ink-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/50 to-transparent" />
    </div>
  );
}
