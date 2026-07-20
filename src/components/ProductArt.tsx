import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

const TONES: Record<string, string> = {
  cups: "from-amber-400/25 via-sand-100 to-sand-200",
  boxes: "from-clay-500/25 via-sand-100 to-sand-200",
  bags: "from-amber-500/20 via-sand-100 to-sand-300",
  wraps: "from-clay-500/15 via-sand-100 to-sand-200",
  containers: "from-amber-400/20 via-sand-100 to-sand-300",
};

function CupArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" fill="none">
      <ellipse cx="100" cy="176" rx="40" ry="7" className="fill-ink-900/10" />
      <path d="M64 70 L136 70 L124 168 Q100 178 76 168 Z" className="fill-amber-500" />
      <path d="M64 70 L136 70 L131 96 L69 96 Z" className="fill-clay-500" />
      <ellipse cx="100" cy="70" rx="36" ry="9" className="fill-sand-50" stroke="currentColor" strokeOpacity=".15" />
      <path
        d="M78 44 Q82 32 74 22 M100 40 Q104 28 96 18 M122 44 Q126 32 118 22"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BoxArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" fill="none">
      <path d="M40 88 L100 62 L160 88 L160 158 L100 184 L40 158 Z" className="fill-clay-500" />
      <path d="M40 88 L100 114 L100 184 L40 158 Z" className="fill-amber-600" />
      <path d="M160 88 L100 114 L100 184 L160 158 Z" className="fill-amber-500" />
      <path d="M100 114 L100 62" stroke="currentColor" strokeOpacity=".2" strokeWidth="3" strokeDasharray="2 6" />
      <rect x="88" y="100" width="24" height="14" rx="2" className="fill-sand-50" />
    </svg>
  );
}

function BagArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" fill="none">
      <path d="M58 78 L142 78 L134 172 Q100 182 66 172 Z" className="fill-amber-500" />
      <rect x="58" y="78" width="84" height="16" className="fill-amber-600" />
      <path
        d="M74 78 Q74 46 100 46 Q126 46 126 78"
        stroke="currentColor"
        strokeOpacity=".3"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <rect x="82" y="104" width="36" height="26" rx="3" className="fill-sand-50" opacity=".8" />
    </svg>
  );
}

function WrapArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" fill="none">
      <rect x="52" y="48" width="96" height="110" rx="48" className="fill-clay-500/70" />
      <g stroke="currentColor" strokeOpacity=".25" strokeWidth="2">
        {[0, 1, 2, 3, 4].map((row) =>
          [0, 1, 2].map((col) => (
            <circle key={`${row}-${col}`} cx={78 + col * 22} cy={70 + row * 22} r="7" />
          ))
        )}
      </g>
      <rect x="52" y="48" width="18" height="110" rx="9" className="fill-amber-500" />
    </svg>
  );
}

function ContainerArt() {
  return (
    <svg viewBox="0 0 200 200" className="h-2/3 w-2/3" fill="none">
      <rect x="46" y="88" width="108" height="82" rx="14" className="fill-amber-500" />
      <path d="M42 76 Q100 56 158 76 L154 92 Q100 74 46 92 Z" className="fill-clay-500" />
      <circle cx="100" cy="127" r="20" className="fill-sand-50" opacity=".7" />
      <circle cx="86" cy="123" r="5" className="fill-amber-700" />
      <circle cx="104" cy="132" r="5" className="fill-amber-700" />
      <circle cx="114" cy="118" r="4" className="fill-amber-700" />
    </svg>
  );
}

const ART: Record<string, () => ReactElement> = {
  cups: CupArt,
  boxes: BoxArt,
  bags: BagArt,
  wraps: WrapArt,
  containers: ContainerArt,
};

export function ProductArt({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  const Art = ART[category] ?? BoxArt;
  const tone = TONES[category] ?? "from-amber-400/20 via-sand-100 to-sand-200";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br text-ink-900",
        tone,
        className
      )}
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-clay-500/10 blur-2xl" />
      <Art />
    </div>
  );
}
