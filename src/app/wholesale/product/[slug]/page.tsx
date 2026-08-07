"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/ProductDetail";
import { ProductCard } from "@/components/ProductCard";
import { PageLoading } from "@/components/PageLoading";
import { getProductBySlug, getRelatedProducts } from "@/lib/products";
import { useAdminData } from "@/lib/store";
import { useWholesaleCart } from "@/lib/wholesale-cart-context";

export default function WholesaleProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { products, loading } = useAdminData();
  const { addToWholesaleCart } = useWholesaleCart();
  const product = getProductBySlug(products, slug);

  if (loading) {
    return <PageLoading />;
  }

  if (!product || product.wholesalePrice == null) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-ink-900">Product not found</h1>
        <p className="mt-3 text-ink-700/70">
          That product isn&apos;t available wholesale, or may have been removed.
        </p>
        <Link
          href="/wholesale"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-forest-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-forest-700"
        >
          Browse Wholesale Catalogue
        </Link>
      </div>
    );
  }

  const related = getRelatedProducts(products, product).filter((p) => p.wholesalePrice != null);

  return (
    <div>
      <ProductDetail
        product={product}
        mode="wholesale"
        onAddToCart={(opts) => addToWholesaleCart(product, opts)}
      />
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <h2 className="font-display text-2xl font-bold text-ink-900">
            Related Products
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} mode="wholesale" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
