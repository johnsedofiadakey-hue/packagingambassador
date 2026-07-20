import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPostBySlug, posts } from "@/lib/posts";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

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
