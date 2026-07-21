"use client";

import { motion } from "framer-motion";

type Segment = { text: string; className?: string };

export function KineticHeadline({
  segments,
  wordDelay = 0.07,
  startDelay = 0,
}: {
  segments: Segment[];
  wordDelay?: number;
  startDelay?: number;
}) {
  const wordCounts = segments.map((seg) => seg.text.split(" ").length);

  return (
    <>
      {segments.map((seg, segIndex) => {
        const segStartIndex = wordCounts.slice(0, segIndex).reduce((a, b) => a + b, 0);
        return (
          <span key={segIndex} className={seg.className}>
            {seg.text.split(" ").map((w, wordIndex) => (
              <motion.span
                key={`${segIndex}-${wordIndex}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: startDelay + (segStartIndex + wordIndex) * wordDelay,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ display: "inline-block", marginRight: "0.28em" }}
              >
                {w}
              </motion.span>
            ))}
          </span>
        );
      })}
    </>
  );
}
