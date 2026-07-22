"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    lenisRef.current = lenis;
    if (process.env.NODE_ENV !== "production") {
      // @ts-expect-error - temporary dev-only debug hook, removed before shipping
      window.__lenis = lenis;
    }

    let frameId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    };
    frameId = requestAnimationFrame(raf);

    // Lenis caches a scroll-limit number at construction time and never
    // recomputes it on its own when async content (Firestore-loaded
    // categories/products/etc.) makes the page taller after initial mount —
    // it just keeps enforcing the stale, shorter limit, so the page can't be
    // scrolled all the way to the real bottom. A MutationObserver on the
    // whole document reacts to those DOM insertions directly and forces
    // Lenis to recompute (debounced — this can fire a lot during a
    // Firestore-driven render burst).
    let resizeTimer: ReturnType<typeof setTimeout>;
    const mutationObserver = new MutationObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => lenisRef.current?.resize(), 150);
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(resizeTimer);
      mutationObserver.disconnect();
      cancelAnimationFrame(frameId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Next.js App Router navigations don't reset native scroll the way Lenis
  // expects — without this, a client-side nav to a new page can leave you
  // scrolled deep into the previous page's position.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
