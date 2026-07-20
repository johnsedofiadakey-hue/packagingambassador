"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Truck, ShieldCheck, Users } from "lucide-react";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCarousel } from "@/components/CategoryCarousel";
import { HeroCollage } from "@/components/HeroCollage";
import { Newsletter } from "@/components/Newsletter";
import { Wave } from "@/components/Wave";
import { Reveal } from "@/components/Reveal";
import { MotionLink } from "@/components/MotionLink";
import { CountUp } from "@/components/CountUp";
import { useAdminData } from "@/lib/store";
import { getTopSellers } from "@/lib/top-sellers";

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
  const { products, categories, orders, settings } = useAdminData();
  const bestSellers = getTopSellers(products, orders, 4);
  const hero = settings.hero;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-sand-300 via-sand-200 to-sand-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-20 lg:grid-cols-2 lg:items-center lg:pb-28 lg:pt-28">
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-sm">
              <Leaf className="h-4 w-4 text-amber-600" />
              {hero.badgeText}
            </span>

            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] text-ink-900 sm:text-6xl">
              {hero.headline}
              {hero.headlineAccent.split("\n").map((line) => (
                <span key={line} className="block text-amber-600">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-md text-lg text-ink-700/80">{hero.subtext}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <MotionLink
                href={hero.ctaPrimaryHref}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
              >
                {hero.ctaPrimaryLabel}
                <ArrowRight className="h-4 w-4" />
              </MotionLink>
              <MotionLink
                href={hero.ctaSecondaryHref}
                whileTap={{ scale: 0.96 }}
                className="inline-flex items-center gap-2 rounded-full border border-forest-700 px-6 py-3 font-semibold text-forest-700 transition-colors hover:bg-forest-700/5"
              >
                {hero.ctaSecondaryLabel}
              </MotionLink>
            </div>

            <div className="mt-10">
              <p className="font-display text-3xl font-extrabold text-amber-600">
                <CountUp value={hero.statValue} />
              </p>
              <p className="text-sm text-ink-700/70">{hero.statLabel}</p>
            </div>
          </div>

          {hero.image ? (
            <div className="relative mx-auto aspect-4/5 w-full max-w-md">
              <div className="h-full w-full overflow-hidden rounded-3xl shadow-xl shadow-ink-900/15">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={hero.image} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="absolute -right-3 -top-3 z-10 flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white shadow-lg">
                <Leaf className="h-4 w-4" />
                Eco Certified
              </div>
            </div>
          ) : (
            <HeroCollage />
          )}
        </div>

        <Wave fillClassName="fill-background" />
      </section>

      {/* Category carousel */}
      <section className="mx-auto max-w-7xl px-6 py-20">
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
                className="group flex w-60 shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50 transition-shadow hover:shadow-lg hover:shadow-ink-900/10 sm:w-64"
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
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto max-w-7xl px-6 py-20">
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
            const green = index % 2 === 1;
            return (
              <Reveal
                key={feature.title}
                delay={index * 0.08}
                className="rounded-2xl border border-ink-900/8 bg-cream-50 p-6"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    green ? "bg-forest-600/12 text-forest-700" : "bg-amber-500/15 text-amber-600"
                  }`}
                >
                  <feature.icon className="h-6 w-6" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 font-display font-semibold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-ink-700/80">{feature.description}</p>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Brand story */}
      <section className="bg-sand-200 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
          <Reveal className="relative">
            <ProductArt category="boxes" className="aspect-4/3 w-full rounded-3xl" />
            <div className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-2xl bg-forest-800 px-4 py-3 text-sm font-semibold text-cream-50 shadow-lg">
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
