"use client";

import { Fragment, useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, ShoppingBag, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData, type Order, type OrderStatus, type WholesaleOrder } from "@/lib/store";
import { auth } from "@/lib/firebase";
import { formatPrice, cn } from "@/lib/utils";

// Statuses that email the customer. The endpoint itself re-checks and de-dupes; this just
// avoids a pointless round-trip for the transitions we never notify on.
const NOTIFIED_STATUSES: OrderStatus[] = ["Processing", "Delivered"];

async function notifyStatusChange(orderId: string, channel: "retail" | "wholesale", status: OrderStatus) {
  if (!NOTIFIED_STATUSES.includes(status)) return;
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/notifications/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId, channel, status }),
    });
  } catch {
    // Best-effort — the status change already saved regardless of the email.
  }
}

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Delivered", "Cancelled"];

// "Active" = still needs work (in the fulfilment queue); everything else is finished history.
const ACTIVE_STATUSES: OrderStatus[] = ["Pending", "Processing"];
type StatusView = "active" | "completed" | "all";

const STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-amber-500/15 text-amber-700",
  Processing: "bg-blue-500/10 text-blue-700",
  Delivered: "bg-forest-800/10 text-forest-800",
  Cancelled: "bg-red-500/10 text-red-700",
};

type Channel = "retail" | "wholesale";
type ChannelFilter = "all" | Channel;

// A shared shape the table renders from, so retail Orders and wholesaleOrders can share one
// table instead of two near-duplicate ones — each row remembers which channel it came from so
// status updates and detail fields route back to the right collection/fields.
type OrderRow = {
  id: string;
  channel: Channel;
  displayName: string;
  phone: string;
  email?: string;
  address: string;
  createdAt: string;
  subtotal: number;
  status: OrderStatus;
  lines: Order["lines"];
  serverValidated?: boolean;
  needsStockReview?: boolean;
  paymentMethod?: "paystack" | "invoice";
  billingAddress?: string;
};

function toRow(order: Order): OrderRow {
  return {
    id: order.id,
    channel: "retail",
    displayName: order.customerName,
    phone: order.phone,
    email: order.email,
    address: order.address,
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    status: order.status,
    lines: order.lines,
    serverValidated: order.serverValidated,
    needsStockReview: order.needsStockReview,
    paymentMethod: order.paymentMethod || "paystack",
  };
}

function toWholesaleRow(order: WholesaleOrder): OrderRow {
  return {
    id: order.id,
    channel: "wholesale",
    displayName: `${order.businessName} · ${order.contactName}`,
    phone: order.phone,
    email: order.email,
    address: order.deliveryAddress,
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    status: order.status,
    lines: order.lines,
    serverValidated: order.serverValidated,
    needsStockReview: order.needsStockReview,
    paymentMethod: order.paymentMethod || "paystack",
    billingAddress: order.billingAddress,
  };
}

export default function AdminOrdersPage() {
  const {
    orders,
    wholesaleOrders,
    loading,
    updateOrderStatus,
    updateWholesaleOrderStatus,
    deleteOrder,
    deleteWholesaleOrder,
  } = useAdminData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChannelFilter>("all");
  // Default to the work-list: staff open Orders to fulfil, not to browse history.
  const [view, setView] = useState<StatusView>("active");

  // Counts per view (respecting the channel filter) so the tabs can show a live backlog badge.
  const counts = useMemo(() => {
    const all = [...orders.map(toRow), ...wholesaleOrders.map(toWholesaleRow)].filter(
      (r) => filter === "all" || r.channel === filter
    );
    return {
      active: all.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
      completed: all.filter((r) => !ACTIVE_STATUSES.includes(r.status)).length,
      all: all.length,
    };
  }, [orders, wholesaleOrders, filter]);

  const rows = useMemo(() => {
    let combined = [...orders.map(toRow), ...wholesaleOrders.map(toWholesaleRow)];
    if (filter !== "all") combined = combined.filter((r) => r.channel === filter);
    if (view === "active") combined = combined.filter((r) => ACTIVE_STATUSES.includes(r.status));
    else if (view === "completed") combined = combined.filter((r) => !ACTIVE_STATUSES.includes(r.status));
    // Active = FIFO (oldest first, so the next order to fulfil sits at the top, matching the #N
    // queue badge). Completed/All = newest first, since those are browsed as history.
    combined.sort((a, b) => {
      if (a.createdAt === b.createdAt) return 0;
      const oldestFirst = a.createdAt < b.createdAt ? -1 : 1;
      return view === "active" ? oldestFirst : -oldestFirst;
    });
    return combined;
  }, [orders, wholesaleOrders, filter, view]);

  // FIFO fulfilment queue: one combined retail+wholesale backlog of un-fulfilled orders,
  // numbered oldest-first (#1 = work next). Filter-independent — the position is a global rank,
  // so it stays stable when the table is filtered to one channel.
  const queuePositions = useMemo(() => {
    const unfulfilled = [...orders.map(toRow), ...wholesaleOrders.map(toWholesaleRow)]
      .filter((r) => r.status === "Pending" || r.status === "Processing")
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return new Map(unfulfilled.map((r, i) => [r.id, i + 1]));
  }, [orders, wholesaleOrders]);

  if (loading) {
    return <PageLoading />;
  }

  const setStatus = async (row: OrderRow, status: OrderStatus) => {
    await (row.channel === "wholesale"
      ? updateWholesaleOrderStatus(row.id, status)
      : updateOrderStatus(row.id, status));
    notifyStatusChange(row.id, row.channel, status);
  };

  const removeRow = (row: OrderRow) => {
    if (!confirm(`Delete order ${row.id}? This permanently removes it and can't be undone.`)) return;
    if (expanded === row.id) setExpanded(null);
    return row.channel === "wholesale" ? deleteWholesaleOrder(row.id) : deleteOrder(row.id);
  };

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        description={
          view === "active"
            ? `${counts.active} to fulfil — oldest first`
            : view === "completed"
              ? `${counts.completed} completed`
              : `${counts.all} order${counts.all === 1 ? "" : "s"} total`
        }
        action={
          <div className="flex gap-1 rounded-full border border-ink-900/8 bg-cream-50 p-1">
            {(["all", "retail", "wholesale"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  filter === f ? "bg-amber-500 text-white" : "text-ink-700 hover:bg-ink-900/5"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-5 flex w-full gap-1 rounded-2xl border border-ink-900/8 bg-cream-50 p-1 sm:w-auto sm:inline-flex">
        {([
          { key: "active", label: "Active", count: counts.active },
          { key: "completed", label: "Completed", count: counts.completed },
          { key: "all", label: "All", count: counts.all },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
              view === t.key ? "bg-amber-500 text-white" : "text-ink-700 hover:bg-ink-900/5"
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                view === t.key ? "bg-white/25 text-white" : "bg-ink-900/8 text-ink-700"
              )}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-900/15 bg-cream-50 p-10 text-center text-sm text-ink-700/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-ink-700/40">
            <ShoppingBag className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p>
            {view === "active"
              ? "You're all caught up — no orders waiting to be fulfilled. 🎉"
              : view === "completed"
                ? "No completed orders yet. Delivered and cancelled orders land here."
                : "No orders yet. Orders placed at checkout on the storefront will show up here."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full min-w-[760px] text-left text-sm">
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
              {rows.map((row) => {
                const isOpen = expanded === row.id;
                return (
                  <Fragment key={row.id}>
                    <tr>
                      <td className="px-5 py-3 font-semibold text-ink-900">
                        {queuePositions.has(row.id) && (
                          <span
                            title="Fulfilment queue position — #1 is the oldest un-fulfilled order (work next)."
                            className="mr-2 inline-block rounded-full bg-ink-900/5 px-2 py-0.5 text-[10px] font-semibold text-ink-700 tabular-nums"
                          >
                            #{queuePositions.get(row.id)}
                          </span>
                        )}
                        {row.id}
                        <span
                          className={cn(
                            "ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            row.channel === "wholesale"
                              ? "bg-forest-600/10 text-forest-700"
                              : "bg-amber-500/10 text-amber-700"
                          )}
                        >
                          {row.channel}
                        </span>
                        {row.serverValidated === false && (
                          <span
                            title="Reconstructed from a Paystack webhook — verify never landed. Double-check before treating as final."
                            className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Needs review
                          </span>
                        )}
                        {row.needsStockReview && (
                          <span
                            title="Ordered more than was in stock — payment already went through, so fulfil and reconcile inventory manually."
                            className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Stock review
                          </span>
                        )}
                        <span
                          className={cn(
                            "ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
                            row.paymentMethod === "invoice"
                              ? "bg-blue-500/10 text-blue-700"
                              : "bg-ink-900/10 text-ink-700"
                          )}
                        >
                          {row.paymentMethod === "invoice" ? "Invoice" : "Paystack"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-700/80">
                        {row.displayName}
                        <div className="text-xs text-ink-700/50">{row.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-700/70">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-ink-900">{formatPrice(row.subtotal)}</td>
                      <td className="px-5 py-3">
                        <select
                          value={row.status}
                          onChange={(e) => setStatus(row, e.target.value as OrderStatus)}
                          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[row.status]}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setExpanded(isOpen ? null : row.id)}
                            aria-label="Toggle details"
                            className="rounded-full p-2 text-ink-700 hover:bg-ink-900/5"
                          >
                            {isOpen ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => removeRow(row)}
                            aria-label={`Delete order ${row.id}`}
                            className="rounded-full p-2 text-ink-700/50 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={6} className="bg-sand-100 px-5 py-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                            Delivery Address
                          </p>
                          <p className="mt-1 text-sm text-ink-800">{row.address}</p>
                          {row.email && (
                            <p className="mt-1 text-sm text-ink-700/70">{row.email}</p>
                          )}
                          {row.billingAddress && row.billingAddress !== row.address && (
                            <>
                              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                                Billing Address
                              </p>
                              <p className="mt-1 text-sm text-ink-800">{row.billingAddress}</p>
                            </>
                          )}

                          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                            Items
                          </p>
                          <ul className="mt-2 space-y-2">
                            {row.lines.map((line, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm text-ink-800">
                                {line.image ? (
                                  <img
                                    src={line.image}
                                    alt={line.name}
                                    className="h-10 w-10 shrink-0 rounded-lg border border-cream-200 object-cover"
                                  />
                                ) : (
                                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cream-200 bg-cream-100 text-xs text-ink-700/40">
                                    —
                                  </span>
                                )}
                                <span className="flex-1">
                                  {line.name} ({line.color}, {line.size}) × {line.quantity}
                                </span>
                                <span className="font-semibold">{formatPrice(line.price * line.quantity)}</span>
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
