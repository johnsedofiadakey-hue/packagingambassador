"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import type { Category, ColorVariant, Product } from "@/lib/products";

const BADGES = ["", "Best Seller", "Eco-Friendly", "New"] as const;

type FormValues = {
  name: string;
  category: string;
  badge: (typeof BADGES)[number];
  price: string;
  compareAtPrice: string;
  unit: string;
  stock: string;
  rating: string;
  reviewCount: string;
  description: string;
  colors: ColorVariant[];
  sizes: string;
  specs: string;
  image?: string;
};

function toFormValues(product?: Product, defaultCategory?: string): FormValues {
  return {
    name: product?.name ?? "",
    category: product?.category ?? defaultCategory ?? "",
    badge: (product?.badge as FormValues["badge"]) ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    unit: product?.unit ?? "",
    stock: product ? String(product.stock) : "",
    rating: product ? String(product.rating) : "5",
    reviewCount: product ? String(product.reviewCount) : "0",
    description: product?.description ?? "",
    colors: product?.colors ?? [],
    sizes: product?.sizes.join(", ") ?? "",
    specs: product?.specs.join("\n") ?? "",
    image: product?.image,
  };
}

export function ProductForm({
  product,
  categories,
  onCancel,
  onSubmit,
}: {
  product?: Product;
  categories: Category[];
  onCancel: () => void;
  onSubmit: (values: Omit<Product, "slug"> & { slug?: string }) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    toFormValues(product, categories[0]?.slug)
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addColor = () =>
    setValues((prev) => ({
      ...prev,
      colors: [...prev.colors, { name: "", hex: "#c8a373" }],
    }));

  const updateColor = (index: number, patch: Partial<ColorVariant>) =>
    setValues((prev) => ({
      ...prev,
      colors: prev.colors.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));

  const removeColor = (index: number) =>
    setValues((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));

  const handleImage = (file: File | undefined) => {
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let imageUrl = values.image;
      if (imageFile) {
        const path = `products/${crypto.randomUUID()}-${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const category = categories.find((c) => c.slug === values.category);
      await onSubmit({
        slug: product?.slug,
        name: values.name.trim(),
        category: values.category,
        categoryLabel: category?.name ?? values.category,
        badge: values.badge || undefined,
        price: Number(values.price) || 0,
        compareAtPrice: Number(values.compareAtPrice) || 0,
        unit: values.unit.trim() || "unit",
        stock: Number(values.stock) || 0,
        rating: Number(values.rating) || 0,
        reviewCount: Number(values.reviewCount) || 0,
        description: values.description.trim(),
        colors: values.colors
          .map((c) => ({ name: c.name.trim(), hex: c.hex }))
          .filter((c) => c.name),
        sizes: values.sizes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        specs: values.specs
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        image: imageUrl,
      });
    } catch {
      setError("Couldn't save this product. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/30 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-white/40 bg-white/75 shadow-xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-white/40 px-6 py-4">
          <h2 className="font-display text-lg font-bold text-ink-900">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 px-6 py-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Photo
            </label>
            <div className="mt-2 flex items-center gap-4">
              {values.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={values.image}
                  alt="Preview"
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-sand-200 text-xs text-ink-700/50">
                  No photo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImage(e.target.files?.[0])}
                className="text-xs text-ink-700/70 file:mr-3 file:rounded-full file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
            </div>
            <p className="mt-1 text-xs text-ink-700/50">
              Uploads to Firebase Storage — leave blank to fall back to illustrated category art.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Product Name
            </label>
            <input
              required
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Category
              </label>
              <select
                required
                value={values.category}
                onChange={(e) => set("category", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Badge
              </label>
              <select
                value={values.badge}
                onChange={(e) => set("badge", e.target.value as FormValues["badge"])}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              >
                {BADGES.map((b) => (
                  <option key={b} value={b}>
                    {b || "None"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Price (GH₵)
              </label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Compare-at Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Optional — shows as a sale"
                value={values.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Unit
              </label>
              <input
                required
                placeholder="50 pcs"
                value={values.unit}
                onChange={(e) => set("unit", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Stock
              </label>
              <input
                required
                type="number"
                min="0"
                value={values.stock}
                onChange={(e) => set("stock", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Rating
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={values.rating}
                onChange={(e) => set("rating", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Review Count
              </label>
              <input
                type="number"
                min="0"
                value={values.reviewCount}
                onChange={(e) => set("reviewCount", e.target.value)}
                className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Description
            </label>
            <textarea
              required
              rows={3}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
                Color Variants
              </label>
              <button
                type="button"
                onClick={addColor}
                className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Color
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {values.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) => updateColor(i, { hex: e.target.value })}
                    className="h-9 w-11 shrink-0 cursor-pointer rounded-lg border border-cream-200 bg-white p-1"
                  />
                  <input
                    placeholder="Color name (e.g. Forest Green)"
                    value={c.name}
                    onChange={(e) => updateColor(i, { name: e.target.value })}
                    className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    aria-label="Remove color"
                    className="shrink-0 rounded-full p-2 text-ink-700/50 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {values.colors.length === 0 && (
                <p className="text-xs text-ink-700/50">No color variants yet — optional.</p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Sizes (comma-separated)
            </label>
            <input
              placeholder="Small, Medium, Large"
              value={values.sizes}
              onChange={(e) => set("sizes", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-ink-700/70">
              Specs (one per line)
            </label>
            <textarea
              rows={3}
              value={values.specs}
              onChange={(e) => set("specs", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-amber-500 py-3 font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
            >
              {saving ? "Saving…" : product ? "Save Changes" : "Add Product"}
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
