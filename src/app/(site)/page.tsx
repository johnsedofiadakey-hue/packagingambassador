"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Truck, ShieldCheck, Users } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { HeroSlider } from "@/components/HeroSlider";
import { Newsletter } from "@/components/Newsletter";
import { Wave } from "@/components/Wave";
import { Reveal } from "@/components/Reveal";
import { MotionLink } from "@/components/MotionLink";
import { useAdminData } from "@/lib/store";
import { useCart } from "@/lib/cart-context";
import { getTopSellers } from "@/lib/top-sellers";
import { defaultVariant } from "@/lib/utils";

const BRAND_ACCENTS = [
  "bg-amber-500/15 text-amber-600",
  "bg-forest-600/12 text-forest-700",
  "bg-clay-700/12 text-clay-700",
  "bg-sunset-500/15 text-sunset-600",
];

const FEATURES = [
  {
    icon: Leaf,
    title: "Eco-Friendly Options",
    description:
      "Sustainably sourced materials and biodegradable products across our range.",
  },
  {
    icon: Truck,
    title: "Fast Ghana Delivery",
    description:
      "Quick turnaround to all regions across Ghana, with bulk discounts available.",
  },
  {
    icon: ShieldCheck,
    title: "Premium Quality",
    description:
      "Every product is food-safe, durable, and built to represent your brand well.",
  },
  {
    icon: Users,
    title: "Wholesale Friendly",
    description: "Special pricing for bulk orders. We support businesses of all sizes.",
  },
];

export default function Home() {
  const { products, categories, settings } = useAdminData();
  const { addToCart } = useCart();
  const bestSellers = getTopSellers(products, 4);
  const hero = settings.hero;

  return (
    <div>
      {/* Full-screen takeover hero */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden text-white">
        <HeroSlider slides={hero.slides} />

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-28 pt-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Leaf className="h-4 w-4 text-amber-300" />
              {hero.badgeText}
            </span>

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.04] text-balance sm:text-6xl lg:text-7xl">
              {hero.headline}{" "}
              {hero.headlineAccent.split("\n").map((line, i) => (
                <span key={i} className="block text-amber-300">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-lg text-lg text-white/85">{hero.subtext}</p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-7 py-3.5 font-semibold text-white shadow-lg shadow-ink-950/20 transition-colors hover:bg-amber-600"
              >
                Shop Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 font-semibold text-white transition-colors hover:bg-white/10"
              >
                Track Your Order
              </Link>
            </div>
          </div>
        </div>

        <Wave fillClassName="fill-background" />
      </section>

      {/* Category carousel */}
      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden
          className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-clay-700/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-widest text-amber-600">
              Browse by Category
            </p>
            <h2 className="mt-2 text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Find What You Need
            </h2>
          </Reveal>

          <Reveal delay={0.1} className="mt-10">
            <CategoryCarousel>
              {categories.map((category) => (
                <MotionLink
                  key={category.slug}
                  href={`/category/${category.slug}`}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="glass group flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl transition-shadow hover:shadow-lg sm:w-64"
                >
                  <ProductArt category={category.slug} className="aspect-4/3 w-full" />
                  <div className="flex items-center justify-between gap-2 p-4">
                    <div>
                      <p className="font-display font-semibold text-ink-900">{category.name}</p>
                      <p className="text-xs text-ink-700/60">{category.description}</p>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white transition-transform group-hover:translate-x-0.5">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </MotionLink>
              ))}
            </CategoryCarousel>
          </Reveal>
        </div>
      </section>

      {/* Best sellers */}
      <section className="bg-sand-200 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-forest-600">
                Top Picks
              </p>
              <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
                Best Sellers
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 font-semibold text-ink-800 hover:text-amber-600"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product, index) => (
              <Reveal key={product.slug} delay={index * 0.06}>
                <ProductCard product={product} onQuickAdd={(p) => addToCart(p, defaultVariant(p))} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden
          className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-forest-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-sunset-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <Reveal>
            <p className="text-center text-sm font-bold uppercase tracking-widest text-amber-600">
              Why Us
            </p>
            <h2 className="mt-2 text-center font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              The Packaging Ambassadors Difference
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => {
              const accent = BRAND_ACCENTS[index % BRAND_ACCENTS.length];
              const card = settings.pageContent.whyUsCards[index] ?? feature;
              return (
                <Reveal
                  key={feature.title}
                  delay={index * 0.08}
                  className="glass rounded-2xl p-6"
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${accent}`}
                  >
                    <feature.icon className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <h3 className="mt-4 font-display font-semibold text-ink-900">{card.title}</h3>
                  <p className="mt-2 text-sm text-ink-700/80">{card.description}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Brand story */}
      <section className="bg-sand-200 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <ProductArt category="boxes" className="aspect-4/3 w-full rounded-3xl" />
            <div className="glass-forest absolute -bottom-5 left-6 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-cream-50 shadow-lg">
              <ShieldCheck className="h-4 w-4 text-amber-400" />
              Premium Packaging
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="text-sm font-bold uppercase tracking-widest text-forest-600">
              Our Story
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
              Born in Ghana. Built for <span className="text-forest-600">Businesses.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-700/80">
              We started Packaging Ambassadors because we saw local businesses
              struggling to find quality packaging that matched their brand. Today we
              serve hundreds of food vendors, retailers, and exporters across Ghana with
              materials that are durable, beautiful, and better for the planet.
            </p>
            <MotionLink
              href="/about"
              whileTap={{ scale: 0.96 }}
              className="mt-8 inline-flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 font-semibold text-forest-700 transition-colors hover:bg-forest-700/5"
            >
              Read Our Story
              <ArrowRight className="h-4 w-4" />
            </MotionLink>
          </Reveal>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-7xl px-6 py-20 text-center">
        <Reveal>
          <h2 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Stay in the Loop
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink-700/80">
            New products, special deals, and packaging tips — straight to your inbox.
          </p>
          <div className="mt-6">
            <Newsletter />
          </div>
        </Reveal>
      </section>
    </div>
  );
}
