import { Wave } from "@/components/Wave";

export function PageHero({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-sand-300 via-sand-200 to-sand-100">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-700">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-ink-900 sm:text-5xl">
          {title}
        </h1>
      </div>
      <Wave fillClassName="fill-background" />
    </section>
  );
}
