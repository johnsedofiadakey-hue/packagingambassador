"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";

export default function BlogPage() {
  const { posts, loading } = useAdminData();

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <PageHero eyebrow="From the Blog" title="Packaging Tips & Guides" />

      <section className="mx-auto max-w-5xl px-6 py-16">
        {posts.length === 0 ? (
          <p className="text-center text-ink-700/60">No posts yet — check back soon.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-ink-900/8 bg-cream-50 p-6 transition-shadow hover:shadow-lg hover:shadow-ink-900/10"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  {post.category}
                </span>
                <h2 className="mt-2 font-display text-xl font-bold text-ink-900 group-hover:underline">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-ink-700/80">{post.excerpt}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-700/60">
                  <span>{post.readTime}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    Read
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
