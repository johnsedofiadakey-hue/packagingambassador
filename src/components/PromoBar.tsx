"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useAdminData } from "@/lib/store";

export function PromoBar() {
  const { settings } = useAdminData();
  const [dismissed, setDismissed] = useState(false);
  const promo = settings.promotion;
  const visible = promo.enabled && promo.text.trim().length > 0 && !dismissed;

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden bg-amber-500 text-white"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2.5 text-center text-sm font-semibold">
            <span>{promo.text}</span>
            {promo.ctaLabel && promo.ctaHref && (
              <Link href={promo.ctaHref} className="underline underline-offset-2 hover:no-underline">
                {promo.ctaLabel}
              </Link>
            )}
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss promotion"
              className="ml-2 shrink-0 rounded-full p-1 transition-colors hover:bg-white/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
