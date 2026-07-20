import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, MapPin, Users } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ProductArt } from "@/components/ProductArt";

const VALUES = [
  {
    icon: Leaf,
    title: "Sustainability First",
    description:
      "We prioritise eco-friendly materials and processes — because packaging that's good for business should also be good for the planet.",
  },
  {
    icon: ShieldCheck,
    title: "Built with Care",
    description:
      "Every product we stock is hand-selected for quality. We only sell packaging we'd be happy to put our own name on.",
  },
  {
    icon: MapPin,
    title: "Made for Ghana",
    description:
      "We understand local business needs, delivery challenges, and the standards your customers expect. We're here, in Ghana, with you.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <PageHero eyebrow="Our Story" title="We Started Because We Cared" />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="max-w-2xl text-lg text-ink-700/80">
          Packaging Ambassadors was founded by a team of Ghanaian entrepreneurs who saw
          a gap: local businesses deserved premium packaging that reflected their
          quality — without the import headaches.
        </p>

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:items-center">
          <ProductArt category="boxes" className="aspect-4/3 w-full rounded-3xl" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              How We Started
            </p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink-900">
              From Accra, to the Nation
            </h2>
            <p className="mt-4 text-ink-700/80">
              In 2020, our founders noticed something: the best local restaurants,
              bakeries, and retailers were packaging their beautiful products in
              whatever was available — and it didn&apos;t match their quality.
            </p>
            <p className="mt-4 text-ink-700/80">
              We built Packaging Ambassadors to change that. Today we carry hundreds of
              products — kraft cups, gift boxes, paper bags, food containers, and more —
              all available in Ghana, shipped fast.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-cream-100 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center font-display text-3xl font-bold text-ink-900">
            What We Stand For
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl bg-cream-50 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                  <value.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-ink-900">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm text-ink-700/80">{value.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl bg-forest-800 p-8 text-cream-50">
            <Users className="h-8 w-8 text-amber-400" />
            <div>
              <p className="font-display text-2xl font-bold">Trusted by 2,000+</p>
              <p className="text-sm text-cream-100/70">
                From street food vendors to established retailers and exporters —
                businesses across Ghana rely on us every day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-ink-900">
          Ready to upgrade your packaging?
        </h2>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Shop Now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
