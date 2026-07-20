"use client";

import { Children, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function CategoryCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = Children.count(children);

  const scroll = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * 288, behavior: "smooth" });
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const max = track.scrollWidth - track.clientWidth;
    const left = max <= 0 ? 0 : (max * index) / Math.max(count - 1, 1);
    track.scrollTo({ left, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onScroll = () => {
      const max = track.scrollWidth - track.clientWidth;
      const progress = max <= 0 ? 0 : track.scrollLeft / max;
      setActive(Math.round(progress * Math.max(count - 1, 0)));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [count]);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      <motion.button
        type="button"
        onClick={() => scroll(-1)}
        whileTap={{ scale: 0.9 }}
        aria-label="Previous categories"
        className="absolute -left-4 top-[38%] hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink-900/10 bg-cream-50 p-2 text-ink-800 shadow-md transition-colors hover:bg-amber-500 hover:text-white lg:flex"
      >
        <ChevronLeft className="h-5 w-5" />
      </motion.button>
      <motion.button
        type="button"
        onClick={() => scroll(1)}
        whileTap={{ scale: 0.9 }}
        aria-label="Next categories"
        className="absolute -right-4 top-[38%] hidden -translate-y-1/2 items-center justify-center rounded-full border border-ink-900/10 bg-cream-50 p-2 text-ink-800 shadow-md transition-colors hover:bg-amber-500 hover:text-white lg:flex"
      >
        <ChevronRight className="h-5 w-5" />
      </motion.button>

      {count > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to category ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                active === i ? "w-6 bg-amber-500" : "w-2 bg-ink-900/15 hover:bg-ink-900/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
