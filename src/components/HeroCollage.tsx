"use client";

import { motion } from "framer-motion";
import { Leaf } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { HeroLidReveal } from "@/components/HeroLidReveal";

export function HeroCollage() {
  return (
    <div className="relative mx-auto aspect-4/5 w-full max-w-md">
      <motion.div
        className="absolute -left-2 bottom-6 z-0 h-[55%] w-[55%] -rotate-6 opacity-90 sm:-left-6"
        initial={{ opacity: 0, x: -40, y: 30, rotate: -30, scale: 0.7 }}
        animate={{ opacity: 0.9, x: 0, y: 0, rotate: -6, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.55, type: "spring", stiffness: 120, damping: 14 }}
      >
        <ProductArt
          category="boxes"
          className="h-full w-full rounded-3xl shadow-lg shadow-ink-900/10"
        />
      </motion.div>

      <motion.div
        className="relative z-10 h-full w-full"
        initial={{ opacity: 0, y: 24, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.45, type: "spring", stiffness: 130, damping: 15 }}
      >
        <ProductArt
          category="cups"
          className="h-full w-full rounded-3xl shadow-xl shadow-ink-900/15"
        />
      </motion.div>

      <motion.div
        className="absolute -left-4 -top-4 z-20 h-[38%] w-[38%] rotate-6 sm:-left-8"
        initial={{ opacity: 0, x: -30, y: -20, rotate: 30, scale: 0.7 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 6, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.7, type: "spring", stiffness: 140, damping: 14 }}
      >
        <ProductArt
          category="bags"
          className="h-full w-full rounded-2xl shadow-lg shadow-ink-900/10"
        />
      </motion.div>

      <motion.div
        className="absolute -right-4 bottom-10 z-20 h-[34%] w-[34%] -rotate-3 sm:-right-8"
        initial={{ opacity: 0, x: 30, y: 20, rotate: -30, scale: 0.7 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: -3, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.8, type: "spring", stiffness: 140, damping: 14 }}
      >
        <ProductArt
          category="containers"
          className="h-full w-full rounded-2xl shadow-lg shadow-ink-900/10"
        />
      </motion.div>

      <motion.div
        className="absolute -right-3 -top-3 z-40 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg"
        initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.5, delay: 1.05, type: "spring", stiffness: 200, damping: 12 }}
      >
        <Leaf className="h-4 w-4" />
        Eco Certified
      </motion.div>

      <HeroLidReveal />
    </div>
  );
}
