import type { Firestore } from "firebase-admin/firestore";
import { getInventorySettings } from "@/lib/inventory/stock";
import { formatPrice } from "@/lib/utils";
import { renderBrandedEmail, DEFAULT_EMAIL_THEME, type EmailTheme } from "@/lib/notifications/email-shell";

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

function buildHtml(stats: SummaryStats, storeName: string, theme: EmailTheme = DEFAULT_EMAIL_THEME) {
  const th = `text-align:left;padding:6px 0;font-size:11px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.textColor};opacity:0.55;border-bottom:2px solid ${theme.textColor}`;
  const cell = `padding:8px 0;border-bottom:1px solid #ece2d0;font-size:14px;color:${theme.textColor}`;

  const topRows =
    stats.topProducts
      .map(
        ([name, qty]) =>
          `<tr><td style="${cell}">${name}</td><td style="${cell};text-align:right;font-weight:700">${qty}</td></tr>`
      )
      .join("") || `<tr><td colspan="2" style="${cell};opacity:0.6">No sales this week.</td></tr>`;

  const lowRows =
    stats.lowStock
      .map(
        (p) =>
          `<tr><td style="${cell}">${p.name}</td><td style="${cell};text-align:right;font-weight:700;color:${p.stock <= 0 ? "#dc2626" : "#b45309"}">${p.stock}</td></tr>`
      )
      .join("") || `<tr><td colspan="2" style="${cell};color:#16794a">All products above threshold. ✅</td></tr>`;

  const statCard = (value: string, label: string) => `
    <td width="50%" style="padding:0 6px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #ece2d0;border-radius:12px;">
        <tr><td style="padding:16px 18px;">
          <div style="font-size:24px;font-weight:800;color:${theme.textColor}">${value}</div>
          <div style="color:${theme.textColor};opacity:0.55;font-size:12px;margin-top:2px">${label}</div>
        </td></tr>
      </table>
    </td>`;

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.primaryColor};">
      Weekly Summary
    </p>
    <h1 style="margin:0 0 4px;font-size:22px;color:${theme.textColor};">The last 7 days at a glance</h1>
    <p style="margin:0 0 22px;font-size:14px;color:${theme.textColor};opacity:0.7;">A quick pulse on sales and stock.</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -6px 26px;">
      <tr>
        ${statCard(formatPrice(stats.revenue), "Revenue (excl. cancelled)")}
        ${statCard(String(stats.orderCount), "Orders")}
      </tr>
    </table>

    <h2 style="font-size:15px;margin:0 0 8px;color:${theme.textColor}">Top products</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:26px">
      <tr><td style="${th}">Product</td><td style="${th};text-align:right">Units</td></tr>
      ${topRows}
    </table>

    <h2 style="font-size:15px;margin:0 0 8px;color:${theme.textColor}">Low stock (≤ ${stats.threshold})</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="${th}">Product</td><td style="${th};text-align:right">Stock</td></tr>
      ${lowRows}
    </table>`;

  return renderBrandedEmail({
    theme,
    contact: { storeName },
    footer: "internal",
    preheader: `${stats.orderCount} orders · ${formatPrice(stats.revenue)} in the last 7 days.`,
    bodyHtml,
  });
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

  const { threshold, storeEmail, storeName, fromAddress, theme } = await getInventorySettings(db);
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
      htmlContent: buildHtml(stats, name, theme),
    }),
  });
  if (!res.ok) {
    console.error("[weekly-summary] Brevo send failed", res.status, await res.text());
    return { sent: false, reason: "The email provider rejected the send." };
  }
  return { sent: true };
}
