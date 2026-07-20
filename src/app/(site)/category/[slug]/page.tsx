"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ShopCatalogue } from "@/components/ShopCatalogue";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { categories, loading } = useAdminData();
  const category = categories.find((c) => c.slug === slug);

  if (loading) {
    return <PageLoading />;
  }

  if (!category) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Category not found</h1>
        <p className="mt-3 text-ink-700/70">
          That category doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHero eyebrow="Category" title={category.name} />
      <ShopCatalogue initialCategory={category.slug} />
    </div>
  );
}
