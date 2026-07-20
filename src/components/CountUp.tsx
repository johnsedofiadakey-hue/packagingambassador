"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

export function CountUp({ value }: { value: string }) {
  const match = value.match(/^([\d,]+)(.*)$/);
  const target = match ? Number(match[1].replace(/,/g, "")) : null;
  const suffix = match ? match[2] : "";
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView || target === null) return;
    const controls = animate(0, target, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v).toLocaleString()),
    });
    return () => controls.stop();
  }, [inView, target]);

  if (target === null) return <span ref={ref}>{value}</span>;

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
