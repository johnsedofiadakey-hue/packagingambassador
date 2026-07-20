import { Leaf } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";

export function HeroCollage() {
  return (
    <div className="relative mx-auto aspect-4/5 w-full max-w-md">
      <div className="absolute -left-2 bottom-6 z-0 h-[55%] w-[55%] -rotate-6 opacity-90 sm:-left-6">
        <ProductArt
          category="boxes"
          className="h-full w-full rounded-3xl shadow-lg shadow-ink-900/10"
        />
      </div>

      <ProductArt
        category="cups"
        className="relative z-10 h-full w-full rounded-3xl shadow-xl shadow-ink-900/15"
      />

      <div className="absolute -left-4 -top-4 z-20 h-[38%] w-[38%] rotate-6 sm:-left-8">
        <ProductArt
          category="bags"
          className="h-full w-full rounded-2xl shadow-lg shadow-ink-900/10"
        />
      </div>

      <div className="absolute -right-4 bottom-10 z-20 h-[34%] w-[34%] -rotate-3 sm:-right-8">
        <ProductArt
          category="containers"
          className="h-full w-full rounded-2xl shadow-lg shadow-ink-900/10"
        />
      </div>

      <div className="absolute -right-3 -top-3 z-30 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
        <Leaf className="h-4 w-4" />
        Eco Certified
      </div>
    </div>
  );
}
