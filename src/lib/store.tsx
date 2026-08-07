"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db, getSecondaryAuth } from "@/lib/firebase";
import type { Category, Product } from "@/lib/products";
import type { CartLine } from "@/lib/cart-context";

export type OrderStatus = "Pending" | "Processing" | "Delivered" | "Cancelled";

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  lines: CartLine[];
  subtotal: number;
  status: OrderStatus;
  paymentMethod?: "paystack" | "invoice";
  paystackReference?: string;
  paidAt?: string;
  /** Set to false only on an order reconstructed from the Paystack webhook fallback path —
   *  the primary verify route never sets this, so its absence means "normal, verified." */
  serverValidated?: boolean;
  webhookReconstructed?: boolean;
  /** True if checkoutLocked was on in settings at the moment this order was created. */
  orderedWhileLocked?: boolean;
  /** Set when the atomic stock decrement found insufficient stock. Payment already
   *  succeeded, so the order stands but needs staff reconciliation. */
  needsStockReview?: boolean;
  stockShortfall?: { slug: string; name: string; requested: number; available: number }[];
};

// Same OrderStatus vocabulary as retail — a second enum here is exactly the kind of drift
// that quietly breaks a badge or a filter later (see the Lollarod review's status-vocabulary
// note). Same reasoning for reusing CartLine: its `price` field is just "price at add-time,"
// which works unchanged whether that price came from `product.price` or `product.wholesalePrice`.
export type WholesaleOrder = {
  id: string;
  createdAt: string;
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
  billingAddress?: string;
  lines: CartLine[];
  subtotal: number;
  status: OrderStatus;
  paymentMethod?: "paystack" | "invoice";
  paystackReference?: string;
  paidAt?: string;
  serverValidated?: boolean;
  webhookReconstructed?: boolean;
  orderedWhileLocked?: boolean;
  needsStockReview?: boolean;
  stockShortfall?: { slug: string; name: string; requested: number; available: number }[];
};

export type BusinessCustomer = {
  id: string; // keyed by phone
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
  billingAddress?: string;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
};

export type StaffRole = "Admin" | "Sales Staff" | "Inventory Staff";

export type StaffMember = {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
};

export type HeroSettings = {
  badgeText: string;
  headline: string;
  headlineAccent: string;
  subtext: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  statValue: string;
  statLabel: string;
  image: string;
  /** Full-bleed hero background video. Takes precedence over slides when set; empty falls
   *  through to slides, then the branded gradient. */
  videoUrl: string;
  /** Full-bleed hero background slideshow — empty falls back to the branded gradient. */
  slides: string[];
};

export type PromotionSettings = {
  enabled: boolean;
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

export type SaleSettings = {
  enabled: boolean;
  headline: string;
  /** ISO datetime the sale ends — drives the countdown. Empty = banner with no timer. */
  endsAt: string;
  ctaLabel: string;
  ctaHref: string;
};

export type ThemeSettings = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
};

export type WhyUsCard = {
  title: string;
  description: string;
};

export type PageContentSettings = {
  aboutIntro: string;
  aboutStoryTitle: string;
  aboutStoryParagraph1: string;
  aboutStoryParagraph2: string;
  whyUsCards: WhyUsCard[];
  footerTagline: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  content: string[];
};

export type StoreSettings = {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  checkoutLocked: boolean;
  checkoutLockMessage: string;
  /** Independent of checkoutLocked — an admin may want to pause one channel, not both. */
  wholesaleCheckoutLocked: boolean;
  wholesaleCheckoutLockMessage: string;
  /** Hard site-wide gate: closes the entire storefront (not just checkout). Staff bypass it. */
  siteLocked: boolean;
  siteLockMessage: string;
  wholesaleMOQ: number;
  lowStockThreshold: number;
  storeAddress: string;
  smsProvider: string;
  smsSenderId: string;
  emailProvider: string;
  emailFromAddress: string;
  hero: HeroSettings;
  promotion: PromotionSettings;
  sale: SaleSettings;
  theme: ThemeSettings;
  pageContent: PageContentSettings;
};

const DEFAULT_HERO: HeroSettings = {
  badgeText: "Ghana's Packaging Partner",
  headline: "Packaging That",
  headlineAccent: "Tells Your\nStory",
  subtext:
    "Premium kraft cups, boxes, bags, and containers — made from quality materials, delivered fast across Ghana.",
  ctaPrimaryLabel: "Shop Now",
  ctaPrimaryHref: "/shop",
  ctaSecondaryLabel: "Track Your Order",
  ctaSecondaryHref: "/track",
  statValue: "2,000+",
  statLabel: "Customers served",
  image: "",
  videoUrl: "/hero-video.mp4",
  slides: [],
};

const DEFAULT_PROMOTION: PromotionSettings = {
  enabled: false,
  text: "Limited time: save on bulk orders — ask us about wholesale pricing.",
  ctaLabel: "Shop Now",
  ctaHref: "/shop",
};

const DEFAULT_SALE: SaleSettings = {
  enabled: false,
  headline: "Flash Sale — limited-time prices across the store",
  endsAt: "",
  ctaLabel: "Shop the Sale",
  ctaHref: "/shop",
};

// Matches the --theme-* defaults in src/app/globals.css — keep both in sync.
export const DEFAULT_THEME: ThemeSettings = {
  primaryColor: "#dd8f2e",
  secondaryColor: "#52702f",
  accentColor: "#e2791f",
  textColor: "#241f16",
  backgroundColor: "#fffbf4",
};

const DEFAULT_PAGE_CONTENT: PageContentSettings = {
  aboutIntro:
    "Packaging Ambassadors was founded by a team of Ghanaian entrepreneurs who saw a gap: local businesses deserved premium packaging that reflected their quality — without the import headaches.",
  aboutStoryTitle: "From Accra, to the Nation",
  aboutStoryParagraph1:
    "In 2020, our founders noticed something: the best local restaurants, bakeries, and retailers were packaging their beautiful products in whatever was available — and it didn't match their quality.",
  aboutStoryParagraph2:
    "We built Packaging Ambassadors to change that. Today we carry hundreds of products — kraft cups, gift boxes, paper bags, food containers, and more — all available in Ghana, shipped fast.",
  whyUsCards: [
    {
      title: "Eco-Friendly Options",
      description: "Sustainably sourced materials and biodegradable products across our range.",
    },
    {
      title: "Fast Ghana Delivery",
      description: "Quick turnaround to all regions across Ghana, with bulk discounts available.",
    },
    {
      title: "Premium Quality",
      description: "Every product is food-safe, durable, and built to represent your brand well.",
    },
    {
      title: "Wholesale Friendly",
      description: "Special pricing for bulk orders. We support businesses of all sizes.",
    },
  ],
  footerTagline:
    "Ghana's packaging partner — premium kraft cups, boxes, bags, and containers for businesses that care about how they show up.",
};

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Packaging Ambassadors",
  storePhone: "+233 XX XXX XXXX",
  storeEmail: "hello@packagingambassadors.com",
  checkoutLocked: false,
  checkoutLockMessage:
    "We're temporarily not accepting new orders — please check back soon, or contact us directly.",
  wholesaleCheckoutLocked: false,
  wholesaleCheckoutLockMessage:
    "Wholesale ordering is temporarily paused — please check back soon, or contact us directly.",
  siteLocked: false,
  siteLockMessage: "We'll be right back — the store is briefly closed for maintenance.",
  wholesaleMOQ: 10,
  lowStockThreshold: 20,
  storeAddress: "Accra, Ghana",
  smsProvider: "Arkesel",
  smsSenderId: "PackAmb",
  emailProvider: "Brevo",
  emailFromAddress: "orders@packagingambassadors.com",
  hero: DEFAULT_HERO,
  promotion: DEFAULT_PROMOTION,
  sale: DEFAULT_SALE,
  theme: DEFAULT_THEME,
  pageContent: DEFAULT_PAGE_CONTENT,
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

type AdminDataContextValue = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  wholesaleOrders: WholesaleOrder[];
  businessCustomers: BusinessCustomer[];
  staff: StaffMember[];
  posts: BlogPost[];
  settings: StoreSettings;
  loading: boolean;

  addProduct: (input: Omit<Product, "slug"> & { slug?: string }) => Promise<Product>;
  updateProduct: (slug: string, patch: Partial<Product>) => Promise<void>;
  removeProduct: (slug: string) => Promise<void>;

  addCategory: (input: Omit<Category, "slug"> & { slug?: string }) => Promise<Category>;
  updateCategory: (slug: string, patch: Partial<Category>) => Promise<void>;
  removeCategory: (slug: string) => Promise<void>;
  reorderCategories: (orderedSlugs: string[]) => Promise<void>;

  addOrder: (input: Omit<Order, "id" | "createdAt" | "status">) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updateWholesaleOrderStatus: (id: string, status: OrderStatus) => Promise<void>;

  addStaff: (input: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    active: boolean;
  }) => Promise<StaffMember>;
  updateStaff: (id: string, patch: Partial<Omit<StaffMember, "id">>) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;

  addPost: (input: Omit<BlogPost, "slug"> & { slug?: string }) => Promise<BlogPost>;
  updatePost: (slug: string, patch: Partial<BlogPost>) => Promise<void>;
  removePost: (slug: string) => Promise<void>;

  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wholesaleOrders, setWholesaleOrders] = useState<WholesaleOrder[]>([]);
  const [businessCustomers, setBusinessCustomers] = useState<BusinessCustomer[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [readyFlags, setReadyFlags] = useState({
    products: false,
    categories: false,
    settings: false,
  });

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map((d) => ({ ...(d.data() as Product), slug: d.id })));
      setReadyFlags((f) => ({ ...f, products: true }));
    });
    const unsubCategories = onSnapshot(
      query(collection(db, "categories"), orderBy("order")),
      (snap) => {
        setCategories(snap.docs.map((d) => ({ ...(d.data() as Category), slug: d.id })));
        setReadyFlags((f) => ({ ...f, categories: true }));
      }
    );
    // Orders and staff are staff-only reads per firestore.rules (customer order details and
    // the staff roster are both private) — but AdminDataProvider is mounted for every visitor,
    // signed in or not, since the storefront needs the rest of this provider's data too. For a
    // signed-out visitor these two subscriptions are expected to fail with permission-denied;
    // the second callback swallows that instead of leaving it as an uncaught console error.
    // orders/staff simply stay empty for anonymous visitors, which the storefront already
    // handles gracefully (e.g. getTopSellers() falls back when there's no order data).
    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id })));
      },
      () => {}
    );
    const unsubStaff = onSnapshot(
      collection(db, "staff"),
      (snap) => {
        setStaff(snap.docs.map((d) => ({ ...(d.data() as StaffMember), id: d.id })));
      },
      () => {}
    );
    // Same staff-only-read, silent-fail-for-anon shape as orders/staff above.
    const unsubWholesaleOrders = onSnapshot(
      query(collection(db, "wholesaleOrders"), orderBy("createdAt", "desc")),
      (snap) => {
        setWholesaleOrders(snap.docs.map((d) => ({ ...(d.data() as WholesaleOrder), id: d.id })));
      },
      () => {}
    );
    const unsubBusinessCustomers = onSnapshot(
      collection(db, "businessCustomers"),
      (snap) => {
        setBusinessCustomers(snap.docs.map((d) => ({ ...(d.data() as BusinessCustomer), id: d.id })));
      },
      () => {}
    );
    const unsubPosts = onSnapshot(
      query(collection(db, "posts"), orderBy("date", "desc")),
      (snap) => {
        setPosts(snap.docs.map((d) => ({ ...(d.data() as BlogPost), slug: d.id })));
      }
    );
    const unsubSettings = onSnapshot(doc(db, "settings", "store"), (snap) => {
      if (snap.exists()) {
        const stored = snap.data() as Partial<StoreSettings>;
        // Deep-merge the nested objects with their defaults — a shallow spread would let a
        // stored `hero`/`promotion`/etc. that predates a newly-added field drop that field
        // entirely (e.g. hero.slides came in later, and older docs don't have it).
        setSettings({
          ...DEFAULT_SETTINGS,
          ...stored,
          hero: { ...DEFAULT_HERO, ...(stored.hero ?? {}) },
          promotion: { ...DEFAULT_PROMOTION, ...(stored.promotion ?? {}) },
          sale: { ...DEFAULT_SALE, ...(stored.sale ?? {}) },
          theme: { ...DEFAULT_THEME, ...(stored.theme ?? {}) },
          pageContent: { ...DEFAULT_PAGE_CONTENT, ...(stored.pageContent ?? {}) },
        });
      }
      setReadyFlags((f) => ({ ...f, settings: true }));
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubStaff();
      unsubWholesaleOrders();
      unsubBusinessCustomers();
      unsubPosts();
      unsubSettings();
    };
  }, []);

  // Fire-and-forget by design — a logging failure must never block the mutation it's
  // recording. Resolves the actor's name/role from the already-loaded `staff` state rather
  // than an extra Firestore read.
  const logActivity = (action: string, details?: Record<string, unknown>) => {
    const uidValue = auth.currentUser?.uid;
    if (!uidValue) return;
    const actor = staff.find((s) => s.id === uidValue);
    addDoc(collection(db, "activity_log"), {
      uid: uidValue,
      name: actor?.name ?? auth.currentUser?.email ?? "Unknown",
      role: actor?.role ?? null,
      action,
      details: details ?? null,
      timestamp: serverTimestamp(),
    }).catch((err) => {
      console.error("[activity_log] failed to write", err);
    });
  };

  const addProduct = async (input: Omit<Product, "slug"> & { slug?: string }) => {
    const slug = input.slug ?? slugify(input.name);
    const product: Product = { ...input, slug } as Product;
    await setDoc(doc(db, "products", slug), product);
    logActivity("product_added", { slug: product.slug, name: product.name });
    return product;
  };

  const updateProduct = async (slug: string, patch: Partial<Product>) => {
    const current = products.find((p) => p.slug === slug);
    await updateDoc(doc(db, "products", slug), patch);
    const stockFrom = current?.stock;
    const stockTo = patch.stock;
    const suspicious =
      typeof stockTo === "number" &&
      typeof stockFrom === "number" &&
      stockFrom > 0 &&
      stockTo > stockFrom * 3;
    logActivity("product_updated", {
      slug,
      fields: Object.keys(patch),
      ...(typeof stockTo === "number" ? { stockFrom, stockTo, suspicious } : {}),
    });
  };

  const removeProduct = async (slug: string) => {
    await deleteDoc(doc(db, "products", slug));
    logActivity("product_removed", { slug });
  };

  const addCategory = async (input: Omit<Category, "slug"> & { slug?: string }) => {
    const slug = input.slug ?? slugify(input.name);
    const category = { ...input, slug };
    await setDoc(doc(db, "categories", slug), { ...category, order: categories.length });
    return category;
  };

  const updateCategory = async (slug: string, patch: Partial<Category>) => {
    await updateDoc(doc(db, "categories", slug), patch);
    // Products carry a denormalized `categoryLabel` for display — cascade a rename so their
    // cards/breadcrumbs don't keep showing the old name until each is re-saved.
    const current = categories.find((c) => c.slug === slug);
    if (patch.name && patch.name !== current?.name) {
      const affected = products.filter((p) => p.category === slug);
      await Promise.all(
        affected.map((p) => updateDoc(doc(db, "products", p.slug), { categoryLabel: patch.name }))
      );
      logActivity("category_renamed", { slug, name: patch.name, productsRelabelled: affected.length });
    }
  };

  const removeCategory = async (slug: string) => {
    await deleteDoc(doc(db, "categories", slug));
  };

  const reorderCategories = async (orderedSlugs: string[]) => {
    await Promise.all(
      orderedSlugs.map((slug, index) => updateDoc(doc(db, "categories", slug), { order: index }))
    );
  };

  const addOrder = async (input: Omit<Order, "id" | "createdAt" | "status">) => {
    const id = uid("ord").toUpperCase();
    const order: Order = {
      ...input,
      id,
      createdAt: new Date().toISOString(),
      status: "Pending",
    };
    await setDoc(doc(db, "orders", id), order);
    return order;
  };

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    await updateDoc(doc(db, "orders", id), { status });
    logActivity("order_status_changed", { orderId: id, status });
  };

  const updateWholesaleOrderStatus = async (id: string, status: OrderStatus) => {
    await updateDoc(doc(db, "wholesaleOrders", id), { status });
    logActivity("wholesale_order_status_changed", { orderId: id, status });
  };

  const addStaff = async (input: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    active: boolean;
  }) => {
    const secondaryAuth = getSecondaryAuth();
    const credential = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email,
      input.password
    );
    const newUid = credential.user.uid;
    await signOut(secondaryAuth);

    const staffMember: StaffMember = {
      id: newUid,
      name: input.name,
      email: input.email,
      role: input.role,
      active: input.active,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, "staff", newUid), staffMember);
    logActivity("staff_added", { staffId: newUid, name: input.name, role: input.role });
    return staffMember;
  };

  const updateStaff = async (id: string, patch: Partial<Omit<StaffMember, "id">>) => {
    await updateDoc(doc(db, "staff", id), patch);
    logActivity("staff_updated", { staffId: id, fields: Object.keys(patch) });
  };

  const removeStaff = async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
    logActivity("staff_removed", { staffId: id });
  };

  const addPost = async (input: Omit<BlogPost, "slug"> & { slug?: string }) => {
    const slug = input.slug ?? slugify(input.title);
    const post: BlogPost = { ...input, slug } as BlogPost;
    await setDoc(doc(db, "posts", slug), post);
    return post;
  };

  const updatePost = async (slug: string, patch: Partial<BlogPost>) => {
    await updateDoc(doc(db, "posts", slug), patch);
  };

  const removePost = async (slug: string) => {
    await deleteDoc(doc(db, "posts", slug));
  };

  const updateSettings = async (patch: Partial<StoreSettings>) => {
    await setDoc(doc(db, "settings", "store"), patch, { merge: true });
    logActivity("settings_changed", { fields: Object.keys(patch) });
  };

  // Storefront pages only ever need products/categories, and are reachable by
  // signed-out visitors — settings is staff-only, so it must not gate the
  // public loading state (it would never resolve for an anonymous visitor).
  const loading = !(readyFlags.products && readyFlags.categories);

  const value = useMemo<AdminDataContextValue>(
    () => ({
      products,
      categories,
      orders,
      wholesaleOrders,
      businessCustomers,
      staff,
      posts,
      settings,
      loading,
      addProduct,
      updateProduct,
      removeProduct,
      addCategory,
      updateCategory,
      removeCategory,
      reorderCategories,
      addOrder,
      updateOrderStatus,
      updateWholesaleOrderStatus,
      addStaff,
      updateStaff,
      removeStaff,
      addPost,
      updatePost,
      removePost,
      updateSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, categories, orders, wholesaleOrders, businessCustomers, staff, posts, settings, loading]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
