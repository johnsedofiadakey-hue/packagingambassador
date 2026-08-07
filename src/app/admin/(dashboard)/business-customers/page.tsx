"use client";

import { Building2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export default function AdminBusinessCustomersPage() {
  const { businessCustomers, loading } = useAdminData();

  if (loading) {
    return <PageLoading />;
  }

  const sorted = [...businessCustomers].sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div>
      <AdminPageHeader
        title="Business Customers"
        description={`${sorted.length} wholesale customer${sorted.length === 1 ? "" : "s"} — built automatically from paid wholesale orders`}
      />

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-900/15 bg-cream-50 p-10 text-center text-sm text-ink-700/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-ink-700/40">
            <Building2 className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p>No wholesale orders yet. A customer record appears here after their first order.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
                <th className="px-5 py-3">Business</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Orders</th>
                <th className="px-5 py-3">Total Spent</th>
                <th className="px-5 py-3">Last Order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {sorted.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-semibold text-ink-900">{c.businessName}</td>
                  <td className="px-5 py-3 text-ink-700/80">
                    {c.contactName}
                    <div className="text-xs text-ink-700/50">
                      {c.phone}
                      {c.email ? ` · ${c.email}` : ""}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-900">{c.orderCount}</td>
                  <td className="px-5 py-3 text-ink-900">{formatPrice(c.totalSpent)}</td>
                  <td className="px-5 py-3 text-ink-700/70">
                    {new Date(c.lastOrderAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
