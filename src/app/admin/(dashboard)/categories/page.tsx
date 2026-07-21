"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";
import type { Category } from "@/lib/products";

function CategoryForm({
  category,
  onCancel,
  onSubmit,
}: {
  category?: Category;
  onCancel: () => void;
  onSubmit: (values: Omit<Category, "slug"> & { slug?: string }) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(category?.description ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 px-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-white/75 p-6 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {category ? "Edit Category" : "Add Category"}
          </h2>
          <button onClick={onCancel} className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ slug: category?.slug, name: name.trim(), description: description.trim() });
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Description
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600"
            >
              {category ? "Save Changes" : "Add Category"}
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

export default function AdminCategoriesPage() {
  const {
    categories,
    products,
    loading,
    addCategory,
    updateCategory,
    removeCategory,
    reorderCategories,
  } = useAdminData();
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  if (loading) {
    return <PageLoading />;
  }

  const move = (index: number, direction: -1 | 1) => {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderCategories(next.map((c) => c.slug));
  };

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description={`${categories.length} categories`}
        action={
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Products</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {categories.map((category, index) => {
              const productCount = products.filter((p) => p.category === category.slug).length;
              return (
                <tr key={category.slug}>
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                        aria-label="Move up"
                        className="rounded-full p-1.5 text-ink-700 hover:bg-ink-900/5 disabled:opacity-25"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => move(index, 1)}
                        disabled={index === categories.length - 1}
                        aria-label="Move down"
                        className="rounded-full p-1.5 text-ink-700 hover:bg-ink-900/5 disabled:opacity-25"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-ink-900">{category.name}</td>
                  <td className="px-5 py-3 text-ink-700/70">{category.description}</td>
                  <td className="px-5 py-3 text-ink-700/80">{productCount}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(category)}
                        aria-label={`Edit ${category.name}`}
                        className="rounded-full p-2 text-ink-700 hover:bg-amber-500/10 hover:text-amber-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (productCount > 0) {
                            alert(
                              `Can't delete "${category.name}" — ${productCount} product(s) still use it. Reassign or remove them first.`
                            );
                            return;
                          }
                          if (confirm(`Delete category "${category.name}"?`)) {
                            removeCategory(category.slug);
                          }
                        }}
                        aria-label={`Delete ${category.name}`}
                        className="rounded-full p-2 text-ink-700 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <CategoryForm
          category={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            if (editing === "new") {
              await addCategory(values);
            } else {
              await updateCategory(editing.slug, values);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
