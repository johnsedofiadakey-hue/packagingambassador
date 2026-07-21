"use client";

import { motion } from "framer-motion";

/**
 * The "unboxing" opening overlay: a box lid flips open and two soft tissue
 * shapes part to either side, then fade away — leaving whatever hero visual
 * sits behind it (photo or illustrated collage) revealed underneath.
 * Mount-triggered, plays once, ~1.1s total.
 */
export function HeroLidReveal() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-3xl"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="absolute inset-x-0 top-0 h-1/2 origin-top"
        style={{
          backgroundImage:
            "linear-gradient(to bottom, var(--color-clay-700), var(--color-amber-600))",
        }}
        initial={{ rotateX: 0, opacity: 1 }}
        animate={{ rotateX: -115, opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.65, 0, 0.35, 1] }}
      />
      <motion.div
        className="absolute -left-10 top-2 h-2/3 w-2/3 rounded-[45%] bg-cream-50/90 blur-md"
        initial={{ opacity: 0.95, x: 0, rotate: 0 }}
        animate={{ opacity: 0, x: -80, rotate: -22 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />
      <motion.div
        className="absolute -right-10 top-2 h-2/3 w-2/3 rounded-[45%] bg-cream-50/90 blur-md"
        initial={{ opacity: 0.95, x: 0, rotate: 0 }}
        animate={{ opacity: 0, x: 80, rotate: 22 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
