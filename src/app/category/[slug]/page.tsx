import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { ShopCatalogue } from "@/components/ShopCatalogue";
import { categories } from "@/lib/products";

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.slug === slug);
  if (!category) notFound();

  return (
    <div>
      <PageHero eyebrow="Category" title={category.name} />
      <ShopCatalogue initialCategory={category.slug} />
    </div>
  );
}
