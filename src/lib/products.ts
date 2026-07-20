export type Category = {
  slug: string;
  name: string;
  description: string;
};

export type Product = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  badge?: "Best Seller" | "Eco-Friendly" | "New";
  rating: number;
  reviewCount: number;
  price: number;
  compareAtPrice?: number;
  unit: string;
  stock: number;
  description: string;
  colors: string[];
  sizes: string[];
  specs: string[];
  image?: string;
};

export const categories: Category[] = [
  { slug: "cups", name: "Cups", description: "Paper cups in all sizes" },
  { slug: "boxes", name: "Boxes", description: "Gift boxes & shipping" },
  { slug: "bags", name: "Bags", description: "Paper & kraft bags" },
  { slug: "wraps", name: "Wraps", description: "Tissue & bubble wrap" },
  { slug: "containers", name: "Containers", description: "Food-grade containers" },
];

export const products: Product[] = [
  {
    slug: "kraft-cup-8oz",
    name: "Kraft Paper Cup 8oz",
    category: "cups",
    categoryLabel: "Cups",
    badge: "Best Seller",
    rating: 4.8,
    reviewCount: 124,
    price: 45,
    unit: "50 pcs",
    stock: 500,
    description:
      "Premium single-wall kraft paper cups. Perfect for hot beverages, soups, and more. Made from responsibly sourced materials.",
    colors: ["Natural Kraft", "Forest Green", "Clay"],
    sizes: ["8oz", "12oz", "16oz"],
    specs: [
      "Food-safe inner lining",
      "Stackable design",
      "Single-wall insulation",
      "Biodegradable",
    ],
  },
  {
    slug: "kraft-box-small",
    name: "Kraft Gift Box — Small",
    category: "boxes",
    categoryLabel: "Boxes",
    badge: "Eco-Friendly",
    rating: 4.9,
    reviewCount: 89,
    price: 120,
    unit: "20 pcs",
    stock: 260,
    description:
      "Sturdy kraft gift boxes with a magnetic-style fold closure. Ideal for retail, gifting, and small product shipping.",
    colors: ["Natural Kraft", "Forest Green", "Clay"],
    sizes: ["Small", "Medium", "Large"],
    specs: [
      "Rigid double-wall construction",
      "Foldable, flat-pack shipping",
      "Custom branding available",
      "Recyclable",
    ],
  },
  {
    slug: "paper-bag-medium",
    name: "Kraft Paper Bag — Medium",
    category: "bags",
    categoryLabel: "Bags",
    badge: "New",
    rating: 4.7,
    reviewCount: 56,
    price: 85,
    unit: "30 pcs",
    stock: 340,
    description:
      "Twisted-handle kraft paper bags built for retail checkout and takeaway. Wide base for stability.",
    colors: ["Natural Kraft", "Forest Green"],
    sizes: ["Small", "Medium", "Large"],
    specs: [
      "Reinforced twisted handles",
      "Wide flat base",
      "Water-resistant coating",
      "Biodegradable",
    ],
  },
  {
    slug: "food-container-750",
    name: "Food Container 750ml",
    category: "containers",
    categoryLabel: "Containers",
    badge: "Best Seller",
    rating: 4.6,
    reviewCount: 73,
    price: 95,
    unit: "25 pcs",
    stock: 410,
    description:
      "Leak-resistant food-grade containers with snap-fit lids. Microwave-safe and freezer-safe for meal prep and delivery.",
    colors: ["Natural Kraft", "Clear"],
    sizes: ["500ml", "750ml", "1000ml"],
    specs: [
      "Snap-fit leak-resistant lid",
      "Microwave & freezer safe",
      "Stackable for storage",
      "Food-grade certified",
    ],
  },
  {
    slug: "bubble-wrap-roll",
    name: "Bubble Wrap Roll",
    category: "wraps",
    categoryLabel: "Wraps",
    rating: 4.5,
    reviewCount: 34,
    price: 60,
    unit: "5m roll",
    stock: 150,
    description:
      "Protective bubble wrap for shipping fragile items. Cushions against impact and vibration in transit.",
    colors: ["Clear"],
    sizes: ["30cm width", "50cm width"],
    specs: [
      "Cushions fragile items",
      "5m per roll",
      "Puncture-resistant film",
      "Recyclable",
    ],
  },
  {
    slug: "double-wall-cup-12oz",
    name: "Double Wall Cup 12oz",
    category: "cups",
    categoryLabel: "Cups",
    badge: "Best Seller",
    rating: 4.9,
    reviewCount: 98,
    price: 75,
    unit: "50 pcs",
    stock: 380,
    description:
      "Insulated double-wall kraft cups that stay cool to the touch — no sleeve required for hot drinks.",
    colors: ["Natural Kraft", "Forest Green", "Clay"],
    sizes: ["8oz", "12oz", "16oz"],
    specs: [
      "Double-wall insulation, no sleeve needed",
      "Food-safe inner lining",
      "Stackable design",
      "Biodegradable",
    ],
  },
];

export function getProductBySlug(list: Product[], slug: string) {
  return list.find((p) => p.slug === slug);
}

export function getProductsByCategory(list: Product[], categorySlug: string) {
  return list.filter((p) => p.category === categorySlug);
}

export function getRelatedProducts(list: Product[], product: Product, count = 3) {
  return list
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, count);
}

export const BADGE_STYLES: Record<string, string> = {
  "Best Seller": "bg-amber-500 text-white",
  "Eco-Friendly": "bg-forest-800 text-cream-50",
  New: "bg-sunset-500 text-white",
};
