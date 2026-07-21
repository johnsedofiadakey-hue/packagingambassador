"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, getSecondaryAuth } from "@/lib/firebase";
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
};

export type PromotionSettings = {
  enabled: boolean;
  text: string;
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

export type StoreSettings = {
  storeName: string;
  storePhone: string;
  storeEmail: string;
  paystackPublicKey: string;
  paystackSecretKey: string;
  smsProvider: string;
  smsSenderId: string;
  emailProvider: string;
  emailFromAddress: string;
  hero: HeroSettings;
  promotion: PromotionSettings;
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
  ctaSecondaryLabel: "Our Story",
  ctaSecondaryHref: "/about",
  statValue: "2,000+",
  statLabel: "Customers served",
  image: "",
};

const DEFAULT_PROMOTION: PromotionSettings = {
  enabled: false,
  text: "Limited time: save on bulk orders — ask us about wholesale pricing.",
  ctaLabel: "Shop Now",
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
  paystackPublicKey: "",
  paystackSecretKey: "",
  smsProvider: "Arkesel",
  smsSenderId: "PackAmb",
  emailProvider: "Resend",
  emailFromAddress: "orders@packagingambassadors.com",
  hero: DEFAULT_HERO,
  promotion: DEFAULT_PROMOTION,
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
  staff: StaffMember[];
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

  addStaff: (input: {
    name: string;
    email: string;
    password: string;
    role: StaffRole;
    active: boolean;
  }) => Promise<StaffMember>;
  updateStaff: (id: string, patch: Partial<Omit<StaffMember, "id">>) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
};

const AdminDataContext = createContext<AdminDataContextValue | null>(null);

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
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
    const unsubOrders = onSnapshot(
      query(collection(db, "orders"), orderBy("createdAt", "desc")),
      (snap) => {
        setOrders(snap.docs.map((d) => ({ ...(d.data() as Order), id: d.id })));
      }
    );
    const unsubStaff = onSnapshot(collection(db, "staff"), (snap) => {
      setStaff(snap.docs.map((d) => ({ ...(d.data() as StaffMember), id: d.id })));
    });
    const unsubSettings = onSnapshot(doc(db, "settings", "store"), (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...(snap.data() as Partial<StoreSettings>) });
      }
      setReadyFlags((f) => ({ ...f, settings: true }));
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
      unsubStaff();
      unsubSettings();
    };
  }, []);

  const addProduct = async (input: Omit<Product, "slug"> & { slug?: string }) => {
    const slug = input.slug ?? slugify(input.name);
    const product: Product = { ...input, slug } as Product;
    await setDoc(doc(db, "products", slug), product);
    return product;
  };

  const updateProduct = async (slug: string, patch: Partial<Product>) => {
    await updateDoc(doc(db, "products", slug), patch);
  };

  const removeProduct = async (slug: string) => {
    await deleteDoc(doc(db, "products", slug));
  };

  const addCategory = async (input: Omit<Category, "slug"> & { slug?: string }) => {
    const slug = input.slug ?? slugify(input.name);
    const category = { ...input, slug };
    await setDoc(doc(db, "categories", slug), { ...category, order: categories.length });
    return category;
  };

  const updateCategory = async (slug: string, patch: Partial<Category>) => {
    await updateDoc(doc(db, "categories", slug), patch);
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
    return staffMember;
  };

  const updateStaff = async (id: string, patch: Partial<Omit<StaffMember, "id">>) => {
    await updateDoc(doc(db, "staff", id), patch);
  };

  const removeStaff = async (id: string) => {
    await deleteDoc(doc(db, "staff", id));
  };

  const updateSettings = async (patch: Partial<StoreSettings>) => {
    await setDoc(doc(db, "settings", "store"), patch, { merge: true });
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
      staff,
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
      addStaff,
      updateStaff,
      removeStaff,
      updateSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products, categories, orders, staff, settings, loading]
  );

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>;
}

export function useAdminData() {
  const ctx = useContext(AdminDataContext);
  if (!ctx) throw new Error("useAdminData must be used within AdminDataProvider");
  return ctx;
}
