"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData, type OrderStatus } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Delivered", "Cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/15 text-amber-700",
  Processing: "bg-blue-500/10 text-blue-700",
  Delivered: "bg-forest-800/10 text-forest-800",
  Cancelled: "bg-red-500/10 text-red-700",
};

export default function AdminOrdersPage() {
  const { orders, loading, updateOrderStatus } = useAdminData();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) {
    return <PageLoading />;
  }

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description={`${orders.length} order${orders.length === 1 ? "" : "s"}`}
      />

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-900/15 bg-cream-50 p-10 text-center text-sm text-ink-700/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-ink-700/40">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p>No orders yet. Orders placed at checkout on the storefront will show up here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {orders.map((order) => {
                const isOpen = expanded === order.id;
                return (
                  <Fragment key={order.id}>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-ink-900">{order.id}</td>
                      <td className="px-5 py-3 text-ink-700/80">
                        {order.customerName}
                        <div className="text-xs text-ink-700/50">{order.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-700/70">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-ink-900">{formatPrice(order.subtotal)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setExpanded(isOpen ? null : order.id)}
                          aria-label="Toggle details"
                          className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5"
                        >
                          {isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="bg-sand-100 px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                            Delivery Address
                          </p>
                          <p className="mt-1 text-sm text-ink-800">{order.address}</p>
                          {order.email && (
                            <p className="mt-1 text-sm text-ink-700/70">{order.email}</p>
                          )}

                          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                            Items
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {order.lines.map((line, i) => (
                              <li key={i} className="flex justify-between text-sm text-ink-800">
                                <span>
                                  {line.name} ({line.color}, {line.size}) × {line.quantity}
                                </span>
                                <span>{formatPrice(line.price * line.quantity)}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
