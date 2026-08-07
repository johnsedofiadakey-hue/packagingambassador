import type { Firestore } from "firebase-admin/firestore";
import { getInventorySettings } from "@/lib/inventory/stock";
import { formatPrice } from "@/lib/utils";

type SummaryStats = {
  orderCount: number;
  revenue: number;
  topProducts: [string, number][];
  lowStock: { name: string; stock: number }[];
  threshold: number;
};

function tally(
  docs: FirebaseFirestore.QueryDocumentSnapshot[],
  acc: { orderCount: number; revenue: number; units: Map<string, number> }
) {
  for (const d of docs) {
    const o = d.data();
    if (o.status === "Cancelled") continue;
    acc.orderCount++;
    acc.revenue += typeof o.subtotal === "number" ? o.subtotal : 0;
    const lines = Array.isArray(o.lines) ? o.lines : [];
    for (const l of lines) {
      if (l && typeof l.name === "string") {
        acc.units.set(l.name, (acc.units.get(l.name) ?? 0) + (Number(l.quantity) || 0));
      }
    }
  }
}

function buildHtml(stats: SummaryStats, storeName: string) {
  const topRows =
    stats.topProducts
      .map(
        ([name, qty]) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${qty}</td></tr>`
      )
      .join("") || `<tr><td colspan="2" style="padding:10px 12px;color:#888">No sales this week.</td></tr>`;

  const lowRows =
    stats.lowStock
      .map(
        (p) =>
          `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:${p.stock <= 0 ? "#dc2626" : "#b45309"}">${p.stock}</td></tr>`
      )
      .join("") || `<tr><td colspan="2" style="padding:10px 12px;color:#16794a">All products above threshold. ✅</td></tr>`;

  return `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#241f16;background:#fffbf4;padding:24px">
  <h1 style="margin:0 0 4px;font-size:22px">${storeName} — Weekly Summary</h1>
  <p style="margin:0 0 20px;color:#777">The last 7 days at a glance.</p>

  <div style="display:flex;gap:16px;margin-bottom:24px">
    <div style="flex:1;background:#fff;border:1px solid #eee;border-radius:12px;padding:16px">
      <div style="font-size:26px;font-weight:800">${formatPrice(stats.revenue)}</div>
      <div style="color:#888;font-size:13px">Revenue (excl. cancelled)</div>
    </div>
    <div style="flex:1;background:#fff;border:1px solid #eee;border-radius:12px;padding:16px">
      <div style="font-size:26px;font-weight:800">${stats.orderCount}</div>
      <div style="color:#888;font-size:13px">Orders</div>
    </div>
  </div>

  <h2 style="font-size:16px;margin:0 0 8px">Top products</h2>
  <table style="border-collapse:collapse;width:100%;margin-bottom:24px">
    <thead><tr><th style="text-align:left;padding:6px 12px;border-bottom:2px solid #241f16">Product</th><th style="text-align:right;padding:6px 12px;border-bottom:2px solid #241f16">Units</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>

  <h2 style="font-size:16px;margin:0 0 8px">Low stock (≤ ${stats.threshold})</h2>
  <table style="border-collapse:collapse;width:100%">
    <thead><tr><th style="text-align:left;padding:6px 12px;border-bottom:2px solid #241f16">Product</th><th style="text-align:right;padding:6px 12px;border-bottom:2px solid #241f16">Stock</th></tr></thead>
    <tbody>${lowRows}</tbody>
  </table>
</body></html>`;
}

/**
 * Computes the last-7-days digest (revenue, orders, top products, low stock) and emails it
 * to the store owner. Date-bounded single-field range queries only — no composite index.
 * Best-effort: returns {sent:false, reason} rather than throwing when it can't send.
 */
export async function runWeeklySummary(db: Firestore): Promise<{ sent: boolean; reason?: string }> {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const [retailSnap, wholesaleSnap] = await Promise.all([
    db.collection("orders").where("createdAt", ">=", weekAgo).get(),
    db.collection("wholesaleOrders").where("createdAt", ">=", weekAgo).get(),
  ]);

  const acc = { orderCount: 0, revenue: 0, units: new Map<string, number>() };
  tally(retailSnap.docs, acc);
  tally(wholesaleSnap.docs, acc);

  const { threshold, storeEmail, storeName, fromAddress } = await getInventorySettings(db);
  const lowSnap = await db.collection("products").where("stock", "<=", threshold).get();
  const lowStock = lowSnap.docs
    .map((d) => ({ name: (d.data().name as string) ?? d.id, stock: (d.data().stock as number) ?? 0 }))
    .sort((a, b) => a.stock - b.stock);

  const stats: SummaryStats = {
    orderCount: acc.orderCount,
    revenue: acc.revenue,
    topProducts: [...acc.units.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5),
    lowStock,
    threshold,
  };

  if (!storeEmail) return { sent: false, reason: "No store email is configured in Settings." };
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { sent: false, reason: "BREVO_API_KEY is not set on the server." };

  const name = storeName || "Packaging Ambassadors";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name, email: fromAddress || "orders@packagingambassadors.com" },
      to: [{ email: storeEmail }],
      subject: `${name} — weekly summary (${stats.orderCount} orders, ${formatPrice(stats.revenue)})`,
      htmlContent: buildHtml(stats, name),
    }),
  });
  if (!res.ok) {
    console.error("[weekly-summary] Brevo send failed", res.status, await res.text());
    return { sent: false, reason: "The email provider rejected the send." };
  }
  return { sent: true };
}
