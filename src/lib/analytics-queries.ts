import {
  collection,
  doc,
  getDoc,
  query,
  where,
  sum,
  getAggregateFromServer,
  getCountFromServer,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { OrderStatus } from "@/lib/store";

const CHANNELS = [
  { key: "retail", coll: "orders" },
  { key: "wholesale", coll: "wholesaleOrders" },
] as const;

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Delivered", "Cancelled"];

export type RevenueTotals = { retail: number; wholesale: number; total: number };
export type ChannelCounts = { retail: number; wholesale: number; total: number };
export type StatusCounts = Record<OrderStatus, number>;
export type MonthlyRevenue = { label: string; retail: number; wholesale: number }[];

export type AnalyticsData = {
  revenue: RevenueTotals;
  orderCounts: ChannelCounts;
  statusCounts: StatusCounts;
  avgOrderValue: number;
  monthly: MonthlyRevenue;
};

// Unfiltered sum(subtotal) — an aggregation with no filter needs no composite index. Revenue is
// gross (every order in these collections was paid before it was ever written; "Cancelled" is a
// fulfilment state, still visible in the status breakdown, not a refund the system tracks).
async function sumSubtotal(coll: string) {
  const snap = await getAggregateFromServer(collection(db, coll), { total: sum("subtotal") });
  return snap.data().total ?? 0;
}

async function countDocs(coll: string, ...filters: ReturnType<typeof where>[]) {
  const snap = await getCountFromServer(query(collection(db, coll), ...filters));
  return snap.data().count;
}

async function revenueTotals(): Promise<RevenueTotals> {
  const [retail, wholesale] = await Promise.all([
    sumSubtotal("orders"),
    sumSubtotal("wholesaleOrders"),
  ]);
  return { retail, wholesale, total: retail + wholesale };
}

async function orderCounts(): Promise<ChannelCounts> {
  const [retail, wholesale] = await Promise.all([
    countDocs("orders"),
    countDocs("wholesaleOrders"),
  ]);
  return { retail, wholesale, total: retail + wholesale };
}

async function statusCounts(): Promise<StatusCounts> {
  const results = await Promise.all(
    STATUSES.map(async (status) => {
      const perChannel = await Promise.all(
        CHANNELS.map((c) => countDocs(c.coll, where("status", "==", status)))
      );
      return [status, perChannel.reduce((a, b) => a + b, 0)] as const;
    })
  );
  return Object.fromEntries(results) as StatusCounts;
}

// Reads the last N monthly rollup docs (revenueStats/{YYYY-MM}) written at order-creation time.
// No aggregation, no index, cost is fixed at N reads regardless of order volume.
async function revenueByMonth(months = 6): Promise<MonthlyRevenue> {
  const now = new Date();
  const monthDefs = Array.from({ length: months }, (_, idx) => {
    const i = months - 1 - idx;
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en", { month: "short" }),
    };
  });

  return Promise.all(
    monthDefs.map(async ({ key, label }) => {
      const snap = await getDoc(doc(db, "revenueStats", key));
      const data = snap.exists() ? snap.data() : {};
      return {
        label,
        retail: typeof data.retail === "number" ? data.retail : 0,
        wholesale: typeof data.wholesale === "number" ? data.wholesale : 0,
      };
    })
  );
}

export async function loadAnalytics(): Promise<AnalyticsData> {
  const [revenue, orderCountsData, statusCountsData, monthly] = await Promise.all([
    revenueTotals(),
    orderCounts(),
    statusCounts(),
    revenueByMonth(6),
  ]);

  const avgOrderValue = orderCountsData.total > 0 ? revenue.total / orderCountsData.total : 0;

  return {
    revenue,
    orderCounts: orderCountsData,
    statusCounts: statusCountsData,
    avgOrderValue,
    monthly,
  };
}
