"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { posts, loading } = useAdminData();

  if (loading) {
    return <PageLoading />;
  }

  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Post not found</h1>
        <p className="mt-3 text-ink-700/70">
          That post doesn&apos;t exist or may have been removed.
        </p>
        <Link
          href="/blog"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
        >
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-amber-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-amber-600">
        {post.category}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-ink-900 sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-ink-700/60">{post.readTime}</p>

      <div className="mt-8 space-y-5 text-ink-700/90">
        {post.content.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
