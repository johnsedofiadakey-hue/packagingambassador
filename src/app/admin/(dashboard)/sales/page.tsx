"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FileText, Receipt, Search } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PageLoading } from "@/components/PageLoading";
import { useAdminData, type Order, type OrderStatus, type WholesaleOrder } from "@/lib/store";
import { formatPrice, cn } from "@/lib/utils";

type Channel = "retail" | "wholesale";

type SaleRow = {
  id: string;
  channel: Channel;
  displayName: string;
  phone: string;
  email?: string;
  address: string;
  createdAt: string;
  subtotal: number;
  status: OrderStatus;
  paymentMethod: string;
  lines: Order["lines"];
  image?: string;
};

function toRetailSale(order: Order): SaleRow {
  return {
    id: order.id,
    channel: "retail",
    displayName: order.customerName || "Walk-in Customer",
    phone: order.phone || "—",
    email: order.email,
    address: order.address || "—",
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    status: order.status,
    paymentMethod: order.paymentMethod || "paystack",
    lines: order.lines,
    image: order.lines?.[0]?.image,
  };
}

function toWholesaleSale(order: WholesaleOrder): SaleRow {
  return {
    id: order.id,
    channel: "wholesale",
    displayName: `${order.businessName} · ${order.contactName}`,
    phone: order.phone || "—",
    email: order.email,
    address: order.deliveryAddress || "—",
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    status: order.status,
    paymentMethod: order.paymentMethod || "paystack",
    lines: order.lines,
    image: order.lines?.[0]?.image,
  };
}

const PAYMENT_LABELS: Record<string, string> = {
  paystack: "Paystack",
  invoice: "Invoice",
  "pos-cash": "POS — Cash",
  "pos-momo": "POS — MoMo",
  "pos-card": "POS — Card",
};

const PAYMENT_STYLES: Record<string, string> = {
  paystack: "bg-ink-900/10 text-ink-700",
  invoice: "bg-blue-500/10 text-blue-700",
  "pos-cash": "bg-forest-800/10 text-forest-800",
  "pos-momo": "bg-amber-500/15 text-amber-700",
  "pos-card": "bg-purple-500/10 text-purple-700",
};

type ChannelFilter = "all" | "retail" | "wholesale" | "pos";

export default function SalesPage() {
  const { orders, wholesaleOrders, loading } = useAdminData();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<ChannelFilter>("all");
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    let combined: SaleRow[] = [
      ...orders.map(toRetailSale),
      ...wholesaleOrders.map(toWholesaleSale),
    ];
    combined.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    if (filter === "pos") {
      combined = combined.filter((r) => r.paymentMethod.startsWith("pos-"));
    } else if (filter !== "all") {
      combined = combined.filter((r) => r.channel === filter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      combined = combined.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.displayName.toLowerCase().includes(q) ||
          r.phone.includes(q)
      );
    }

    return combined;
  }, [orders, wholesaleOrders, filter, search]);

  if (loading) return <PageLoading />;

  const totalRevenue = rows.reduce((sum, r) => sum + r.subtotal, 0);

  return (
    <div>
      <AdminPageHeader
        title="Sales Records"
        description={`${rows.length} sale${rows.length === 1 ? "" : "s"} · Total: ${formatPrice(totalRevenue)}`}
      />

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full border border-ink-900/8 bg-cream-50 p-1">
          {(["all", "retail", "wholesale", "pos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                filter === f ? "bg-amber-500 text-white" : "text-ink-700 hover:bg-ink-900/5"
              )}
            >
              {f === "pos" ? "POS" : f}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-700/40" />
          <input
            type="text"
            placeholder="Search by order ID, customer, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-cream-200 bg-white/70 py-2 pl-9 pr-4 text-sm focus:border-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/40"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-900/15 bg-cream-50 p-10 text-center text-sm text-ink-700/60">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-900/5 text-ink-700/40">
            <Receipt className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p>No sales found matching your criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-ink-900/8 bg-cream-50">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink-900/8 text-xs uppercase tracking-wide text-ink-700/50">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-900/5">
              {rows.map((row) => {
                const isOpen = expanded === row.id;
                const invoiceHref =
                  row.channel === "wholesale"
                    ? `/wholesale/invoice/${row.id}`
                    : `/admin/sales/invoice/${row.id}`;
                return (
                  <Fragment key={row.id}>
                    <tr className="hover:bg-white/50">
                      <td className="px-5 py-3 font-semibold text-ink-900">
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
                      </td>
                      <td className="px-5 py-3 text-ink-700/80">
                        {row.displayName}
                        <div className="text-xs text-ink-700/50">{row.phone}</div>
                      </td>
                      <td className="px-5 py-3 text-ink-700/70">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-ink-900">
                        {formatPrice(row.subtotal)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            PAYMENT_STYLES[row.paymentMethod] || "bg-ink-900/10 text-ink-700"
                          )}
                        >
                          {PAYMENT_LABELS[row.paymentMethod] || row.paymentMethod}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <a
                          href={invoiceHref}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-900/10 bg-white px-2.5 py-1 text-xs font-semibold text-ink-800 hover:bg-cream-100"
                        >
                          <FileText className="h-3 w-3" />
                          Print
                        </a>
                      </td>
                      <td className="px-5 py-3 text-right">
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
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-sand-100 px-5 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
                                Address
                              </p>
                              <p className="mt-1 text-sm text-ink-800">{row.address}</p>
                              {row.email && (
                                <p className="mt-1 text-sm text-ink-700/70">{row.email}</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-ink-700/50">
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
                                    <span className="font-semibold">
                                      {formatPrice(line.price * line.quantity)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
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
