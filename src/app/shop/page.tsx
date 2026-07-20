import { PageHero } from "@/components/PageHero";
import { ShopCatalogue } from "@/components/ShopCatalogue";

export default function ShopPage() {
  return (
    <div>
      <PageHero eyebrow="Our Catalogue" title="All Products" />
      <ShopCatalogue />
    </div>
  );
}
