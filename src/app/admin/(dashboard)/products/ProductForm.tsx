"use client";

import { useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { storage } from "@/lib/firebase";
import { normalizeSizes } from "@/lib/utils";
import type { Category, ColorVariant, Product, SizeOption } from "@/lib/products";

const BADGES = ["", "Best Seller", "Eco-Friendly", "New"] as const;

const inputCls =
  "mt-2 w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40";
const labelCls = "text-xs font-semibold uppercase tracking-wide text-ink-700/70";

type FormValues = {
  name: string;
  category: string;
  badge: (typeof BADGES)[number];
  price: string;
  compareAtPrice: string;
  wholesalePrice: string;
  wholesaleMinQty: string;
  unit: string;
  stock: string;
  description: string;
  colors: ColorVariant[];
  sizes: SizeRow[];
  specs: string;
  image?: string;
};

// Price is a string here so the numeric input can be empty (= "use the base price").
type SizeRow = { name: string; price: string };

function toFormValues(product?: Product, defaultCategory?: string): FormValues {
  return {
    name: product?.name ?? "",
    category: product?.category ?? defaultCategory ?? "",
    badge: (product?.badge as FormValues["badge"]) ?? "",
    price: product ? String(product.price) : "",
    compareAtPrice: product?.compareAtPrice ? String(product.compareAtPrice) : "",
    wholesalePrice: product?.wholesalePrice ? String(product.wholesalePrice) : "",
    wholesaleMinQty: product?.wholesaleMinQty ? String(product.wholesaleMinQty) : "",
    unit: product?.unit ?? "",
    stock: product ? String(product.stock) : "",
    description: product?.description ?? "",
    colors: product?.colors ?? [],
    sizes: normalizeSizes(product?.sizes).map((s) => ({
      name: s.name,
      price: typeof s.price === "number" ? String(s.price) : "",
    })),
    specs: product?.specs.join("\n") ?? "",
    image: product?.image,
  };
}

/** Collapsible "advanced" section — keeps the initial form short. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-xl border border-cream-200 bg-white/50">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink-800 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown className="h-4 w-4 text-ink-700/50 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 px-4 pb-4 pt-1">{children}</div>
    </details>
  );
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
  const [values, setValues] = useState<FormValues>(() => toFormValues(product, categories[0]?.slug));
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const addColor = () =>
    setValues((prev) => ({ ...prev, colors: [...prev.colors, { name: "", hex: "#c8a373" }] }));
  const updateColor = (index: number, patch: Partial<ColorVariant>) =>
    setValues((prev) => ({
      ...prev,
      colors: prev.colors.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  const removeColor = (index: number) =>
    setValues((prev) => ({ ...prev, colors: prev.colors.filter((_, i) => i !== index) }));

  const addSize = () => setValues((prev) => ({ ...prev, sizes: [...prev.sizes, { name: "", price: "" }] }));
  const updateSize = (index: number, patch: Partial<SizeRow>) =>
    setValues((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));
  const removeSize = (index: number) =>
    setValues((prev) => ({ ...prev, sizes: prev.sizes.filter((_, i) => i !== index) }));

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
        wholesalePrice: Number(values.wholesalePrice) || undefined,
        wholesaleMinQty: Number(values.wholesaleMinQty) || undefined,
        unit: values.unit.trim() || "unit",
        stock: Number(values.stock) || 0,
        // Rating / review count aren't shop-owner inputs — keep any existing values, else sensible defaults.
        rating: product?.rating ?? 5,
        reviewCount: product?.reviewCount ?? 0,
        description: values.description.trim(),
        colors: values.colors.map((c) => ({ name: c.name.trim(), hex: c.hex })).filter((c) => c.name),
        sizes: values.sizes
          .map((s): SizeOption | null => {
            const name = s.name.trim();
            if (!name) return null;
            const price = Number(s.price);
            return price > 0 ? { name, price } : { name };
          })
          .filter((s): s is SizeOption => s !== null),
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
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">
              {product ? "Edit Product" : "Add Product"}
            </h2>
            <p className="text-xs text-ink-700/60">Only name, category, price and stock are required.</p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 px-6 py-6">
          {/* --- Essentials (always visible) --- */}
          <div>
            <label className={labelCls}>Photo</label>
            <div className="mt-2 flex items-center gap-4">
              {values.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={values.image} alt="Preview" className="h-20 w-20 rounded-xl object-cover" />
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
              Optional — leave blank to use the illustrated category art.
            </p>
          </div>

          <div>
            <label className={labelCls}>Product Name</label>
            <input required value={values.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Category</label>
            <select
              required
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Price (GH₵)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={values.price}
                onChange={(e) => set("price", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Stock</label>
              <input
                required
                type="number"
                min="0"
                value={values.stock}
                onChange={(e) => set("stock", e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              placeholder="A short description shown on the product page."
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className={inputCls}
            />
          </div>

          {/* --- Pricing & wholesale (collapsed) --- */}
          <Section title="Pricing & wholesale (optional)">
            <div>
              <label className={labelCls}>Compare-at Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Higher than price — shows a strikethrough sale"
                value={values.compareAtPrice}
                onChange={(e) => set("compareAtPrice", e.target.value)}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Wholesale Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Blank = not sold wholesale"
                  value={values.wholesalePrice}
                  onChange={(e) => set("wholesalePrice", e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Min. Wholesale Qty</label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Defaults to 1"
                  value={values.wholesaleMinQty}
                  onChange={(e) => set("wholesaleMinQty", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
          </Section>

          {/* --- Variants & details (collapsed) --- */}
          <Section title="Variants & details (optional)">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Badge</label>
                <select
                  value={values.badge}
                  onChange={(e) => set("badge", e.target.value as FormValues["badge"])}
                  className={inputCls}
                >
                  {BADGES.map((b) => (
                    <option key={b} value={b}>
                      {b || "None"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Unit / Pack</label>
                <input
                  placeholder="e.g. 50 pcs"
                  value={values.unit}
                  onChange={(e) => set("unit", e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Sizes &amp; prices</label>
                <button
                  type="button"
                  onClick={addSize}
                  className="flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Size
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {values.sizes.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      placeholder="Size (e.g. Small)"
                      value={s.name}
                      onChange={(e) => updateSize(i, { name: e.target.value })}
                      className="w-full rounded-xl border border-cream-200 bg-white px-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Price"
                      value={s.price}
                      onChange={(e) => updateSize(i, { price: e.target.value })}
                      className="w-24 shrink-0 rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => removeSize(i)}
                      aria-label="Remove size"
                      className="shrink-0 rounded-full p-2 text-ink-700/50 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {values.sizes.length === 0 && (
                  <p className="text-xs text-ink-700/50">No sizes yet — optional.</p>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-700/50">
                Each size can carry its own price — the storefront updates live when the customer
                picks one. Leave a price blank to use the main price above.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className={labelCls}>Color Variants</label>
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
                  <p className="text-xs text-ink-700/50">No color variants — optional.</p>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>Specs (one per line)</label>
              <textarea
                rows={3}
                placeholder={"Food-safe\nBiodegradable\n300gsm kraft"}
                value={values.specs}
                onChange={(e) => set("specs", e.target.value)}
                className={inputCls}
              />
            </div>
          </Section>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

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
