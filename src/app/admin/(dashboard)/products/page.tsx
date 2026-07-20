"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Upload } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { ProductForm } from "@/app/admin/(dashboard)/products/ProductForm";
import { ImportCsvModal } from "@/app/admin/(dashboard)/products/ImportCsvModal";
import { useAdminData } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/products";

export default function AdminProductsPage() {
  const { products, categories, loading, addProduct, updateProduct, removeProduct } =
    useAdminData();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [importing, setImporting] = useState(false);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"} in the catalogue`}
        action={
          <div className="flex gap-2">
            <button
              onClick={() => setImporting(true)}
              className="inline-flex items-center gap-2 rounded-full border border-ink-900/15 px-5 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:bg-ink-900/5"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>
            <button
              onClick={() => setEditing("new")}
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
              <th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Stock</th>
              <th className="px-5 py-3">Badge</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-900/5">
            {products.map((product) => (
              <tr key={product.slug}>
                <td className="flex items-center gap-3 px-5 py-3">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-sand-200" />
                  )}
                  <span className="font-medium text-ink-900">{product.name}</span>
                </td>
                <td className="px-5 py-3 text-ink-700/80">{product.categoryLabel}</td>
                <td className="px-5 py-3 text-ink-900">{formatPrice(product.price)}</td>
                <td className="px-5 py-3">
                  <span className={product.stock < 50 ? "font-semibold text-red-600" : "text-ink-700/80"}>
                    {product.stock}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-700/60">{product.badge ?? "—"}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditing(product)}
                      aria-label={`Edit ${product.name}`}
                      className="rounded-full p-2 text-ink-700 hover:bg-amber-500/10 hover:text-amber-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${product.name}" from the catalogue?`)) {
                          removeProduct(product.slug);
                        }
                      }}
                      aria-label={`Remove ${product.name}`}
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
        {products.length === 0 && (
          <p className="p-10 text-center text-sm text-ink-700/60">
            No products yet. Add your first one to get started.
          </p>
        )}
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? undefined : editing}
          categories={categories}
          onCancel={() => setEditing(null)}
          onSubmit={async (values) => {
            if (editing === "new") {
              await addProduct(values);
            } else {
              await updateProduct(editing.slug, values);
            }
            setEditing(null);
          }}
        />
      )}

      {importing && (
        <ImportCsvModal
          categories={categories}
          onCancel={() => setImporting(false)}
          onImport={async (rows) => {
            for (const product of rows) {
              await addProduct(product);
            }
          }}
        />
      )}
    </div>
  );
}
