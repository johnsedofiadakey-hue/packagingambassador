import type { Category, ColorVariant, Product } from "@/lib/products";

const ALLOWED_BADGES = ["Best Seller", "Eco-Friendly", "New"] as const;

export const PRODUCT_CSV_HEADERS = [
  "name",
  "category",
  "badge",
  "price",
  "compareAtPrice",
  "unit",
  "stock",
  "rating",
  "reviewCount",
  "description",
  "colors",
  "sizes",
  "specs",
] as const;

export type ImportRowResult =
  | { ok: true; row: number; product: Omit<Product, "slug">; slug?: string }
  | { ok: false; row: number; reason: string };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\r") {
      i++;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

function splitList(value: string): string[] {
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

// "Natural Kraft:#c8a373;Forest Green:#405c26" — malformed entries (missing/invalid hex) are
// dropped silently rather than failing the whole row, since colors are decorative/optional.
function parseColorVariants(value: string): ColorVariant[] {
  return splitList(value)
    .map((entry) => {
      const [name, hex] = entry.split(":").map((s) => s.trim());
      return { name, hex };
    })
    .filter((c): c is ColorVariant => Boolean(c.name) && HEX_PATTERN.test(c.hex));
}

export function parseProductsCsv(text: string, categories: Category[]): ImportRowResult[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const colIndex = (name: string) => header.indexOf(name.toLowerCase());

  const idx = {
    name: colIndex("name"),
    category: colIndex("category"),
    badge: colIndex("badge"),
    price: colIndex("price"),
    compareAtPrice: colIndex("compareatprice"),
    unit: colIndex("unit"),
    stock: colIndex("stock"),
    rating: colIndex("rating"),
    reviewCount: colIndex("reviewcount"),
    description: colIndex("description"),
    colors: colIndex("colors"),
    sizes: colIndex("sizes"),
    specs: colIndex("specs"),
  };

  const results: ImportRowResult[] = [];

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    const get = (i: number) => (i >= 0 && i < cells.length ? cells[i].trim() : "");

    const name = get(idx.name);
    const categoryInput = get(idx.category);
    const priceRaw = get(idx.price);
    const unit = get(idx.unit) || "unit";
    const stockRaw = get(idx.stock);
    const badgeRaw = get(idx.badge);

    if (!name) {
      results.push({ ok: false, row: r + 1, reason: "Missing product name" });
      continue;
    }

    const category = categories.find(
      (c) =>
        c.slug.toLowerCase() === categoryInput.toLowerCase() ||
        c.name.toLowerCase() === categoryInput.toLowerCase()
    );
    if (!category) {
      results.push({ ok: false, row: r + 1, reason: `Unknown category "${categoryInput}"` });
      continue;
    }

    const price = Number(priceRaw);
    if (!priceRaw || Number.isNaN(price) || price < 0) {
      results.push({ ok: false, row: r + 1, reason: `Invalid price "${priceRaw}"` });
      continue;
    }

    const stock = Number(stockRaw);
    if (!stockRaw || Number.isNaN(stock) || stock < 0) {
      results.push({ ok: false, row: r + 1, reason: `Invalid stock "${stockRaw}"` });
      continue;
    }

    let badge: Product["badge"] = undefined;
    if (badgeRaw) {
      const match = ALLOWED_BADGES.find((b) => b.toLowerCase() === badgeRaw.toLowerCase());
      if (!match) {
        results.push({
          ok: false,
          row: r + 1,
          reason: `Badge must be one of: ${ALLOWED_BADGES.join(", ")} (or blank)`,
        });
        continue;
      }
      badge = match;
    }

    const compareAtPrice = Number(get(idx.compareAtPrice)) || 0;
    const rating = Number(get(idx.rating)) || 5;
    const reviewCount = Number(get(idx.reviewCount)) || 0;

    results.push({
      ok: true,
      row: r + 1,
      product: {
        name,
        category: category.slug,
        categoryLabel: category.name,
        badge,
        price,
        compareAtPrice,
        unit,
        stock,
        rating,
        reviewCount,
        description: get(idx.description),
        colors: parseColorVariants(get(idx.colors)),
        sizes: splitList(get(idx.sizes)),
        specs: splitList(get(idx.specs)),
      },
    });
  }

  return results;
}

export function buildCsvTemplate(): string {
  const header = PRODUCT_CSV_HEADERS.join(",");
  const example = [
    "Kraft Paper Cup 8oz",
    "cups",
    "Best Seller",
    "45",
    "",
    "50 pcs",
    "500",
    "4.8",
    "124",
    "Premium single-wall kraft paper cups.",
    "Natural Kraft:#c8a373;Forest Green:#405c26",
    "8oz;12oz;16oz",
    "Food-safe inner lining;Stackable design",
  ]
    .map((cell) => (cell.includes(",") ? `"${cell}"` : cell))
    .join(",");
  return `${header}\n${example}\n`;
}
