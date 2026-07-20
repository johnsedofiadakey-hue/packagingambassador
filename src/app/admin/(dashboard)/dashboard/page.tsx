"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, DollarSign, Package, ShoppingBag, Sparkles } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import {
  categories as sampleCategories,
  products as sampleProducts,
} from "@/lib/products";

const LOW_STOCK_THRESHOLD = 50;

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/15 text-amber-700",
  Processing: "bg-blue-500/10 text-blue-700",
  Delivered: "bg-forest-800/10 text-forest-800",
  Cancelled: "bg-red-500/10 text-red-700",
};

function SeedCatalogBanner() {
  const { categories, addCategory, addProduct } = useAdminData();
  const [seeding, setSeeding] = useState(false);
  const [done, setDone] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      for (const category of sampleCategories) {
        await addCategory(category);
      }
      for (const product of sampleProducts) {
        await addProduct(product);
      }
      setDone(true);
    } finally {
      setSeeding(false);
    }
  };

  if (categories.length > 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
      <div>
        <p className="font-display font-semibold text-ink-900">
          Your catalog is empty
        </p>
        <p className="mt-1 text-sm text-ink-700/70">
          No products or categories exist in Firestore yet, so the storefront has nothing to
          show. Seed it with the {sampleCategories.length} starter categories and{" "}
          {sampleProducts.length} sample products to get going.
        </p>
      </div>
      <button
        onClick={handleSeed}
        disabled={seeding || done}
        className="flex shrink-0 items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:opacity-60"
      >
        <Sparkles className="h-4 w-4" />
        {done ? "Seeded ✓" : seeding ? "Seeding…" : "Seed Sample Catalog"}
      </button>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { products, orders, loading } = useAdminData();

  if (loading) {
    return <PageLoading />;
  }

  const revenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.subtotal, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const lowStock = products.filter((p) => p.stock < LOW_STOCK_THRESHOLD);
  const recentOrders = orders.slice(0, 5);

  const cards = [
    { label: "Total Revenue", value: formatPrice(revenue), icon: DollarSign },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag },
    { label: "Pending Orders", value: pendingOrders, icon: AlertTriangle },
    { label: "Products", value: products.length, icon: Package },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="An overview of sales, orders, and stock across the store."
      />

      <SeedCatalogBanner />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
              <card.icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="mt-4 font-display text-2xl font-bold text-ink-900">{card.value}</p>
            <p className="text-sm text-ink-700/70">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-ink-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-amber-600 hover:underline">
              View all
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-ink-900/15 p-8 text-center text-sm text-ink-700/60">
              No orders yet. Orders placed at checkout on the storefront will show up here.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-ink-700/50">
                    <th className="pb-2 pr-4">Order</th>
                    <th className="pb-2 pr-4">Customer</th>
                    <th className="pb-2 pr-4">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/5">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="py-3 pr-4 font-semibold text-ink-900">{order.id}</td>
                      <td className="py-3 pr-4 text-ink-700/80">{order.customerName}</td>
                      <td className="py-3 pr-4 text-ink-900">{formatPrice(order.subtotal)}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink-900/8 bg-cream-50 p-5">
          <h2 className="font-display font-semibold text-ink-900">Low Stock Warnings</h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-ink-700/60">
              Nothing below {LOW_STOCK_THRESHOLD} units right now.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {lowStock.map((p) => (
                <li key={p.slug} className="flex items-center justify-between text-sm">
                  <span className="text-ink-800">{p.name}</span>
                  <span className="font-semibold text-red-600">{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
