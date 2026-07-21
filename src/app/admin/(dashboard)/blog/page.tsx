"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";
import type { BlogPost } from "@/lib/store";

function BlogForm({
  post,
  onCancel,
  onSubmit,
}: {
  post?: BlogPost;
  onCancel: () => void;
  onSubmit: (values: Omit<BlogPost, "slug"> & { slug?: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [date, setDate] = useState(post?.date ?? new Date().toISOString().slice(0, 10));
  const [readTime, setReadTime] = useState(post?.readTime ?? "4 min read");
  const [content, setContent] = useState((post?.content ?? []).join("\n\n"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 px-6 py-10 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-white/40 bg-white/90 p-6 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {post ? "Edit Post" : "Add Post"}
          </h2>
          <button onClick={onCancel} className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const paragraphs = content
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean);
            onSubmit({
              slug: post?.slug,
              title: title.trim(),
              excerpt: excerpt.trim(),
              category: category.trim(),
              date,
              readTime: readTime.trim(),
              content: paragraphs,
            });
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Excerpt
            </label>
            <textarea
              required
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Category
              </label>
              <input
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Date
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Read Time
              </label>
              <input
                required
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Content — separate paragraphs with a blank line
            </label>
            <textarea
              required
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {post ? "Save Changes" : "Add Post"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-ink-900/15 px-6 py-3 font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const { posts, loading, addPost, updatePost, removePost } = useAdminData();
  const [editing, setEditing] = useState<BlogPost | "new" | null>(null);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Blog"
        description={`${posts.length} post${posts.length === 1 ? "" : "s"}`}
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Add Post
          </button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {posts.map((post) => (
              <tr key={post.slug}>
                <td className="px-5 py-3 font-medium text-ink-900">{post.title}</td>
                <td className="px-5 py-3 text-ink-700/70">{post.category}</td>
                <td className="px-5 py-3 text-ink-700/70">{post.date}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(post)}
                      aria-label={`Edit ${post.title}`}
                      className="rounded-full p-2 text-ink-700 hover:bg-amber-500/10 hover:text-amber-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete post "${post.title}"?`)) {
                          removePost(post.slug);
                        }
                      }}
                      aria-label={`Delete ${post.title}`}
                      className="rounded-full p-2 text-ink-700 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <BlogForm
          post={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            if (editing === "new") {
              await addPost(values);
            } else {
              await updatePost(editing.slug, values);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
