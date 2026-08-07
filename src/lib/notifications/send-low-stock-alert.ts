import type { LowStockItem } from "@/lib/inventory/stock";

/**
 * Emails the store owner when products cross into low stock. Best-effort — a missing
 * BREVO_API_KEY or a send failure never blocks the order that triggered it. Dedup is
 * handled upstream (the `lowStockAlerted` flag), so this only ever receives products
 * that genuinely just crossed the threshold.
 */
export async function sendLowStockAlert(opts: {
  items: LowStockItem[];
  threshold: number;
  storeEmail?: string;
  storeName?: string;
  fromAddress?: string;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[low-stock] BREVO_API_KEY not set — skipping alert.");
    return false;
  }
  if (opts.items.length === 0 || !opts.storeEmail) return false;

  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${i.name}</td>` +
        `<td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${i.stock}</td></tr>`
    )
    .join("");

  const plural = opts.items.length === 1 ? "" : "s";
  const html = `<!doctype html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#241f16;background:#fffbf4;padding:24px">
  <h2 style="margin:0 0 8px">Low stock alert</h2>
  <p style="margin:0 0 16px;color:#555">${opts.items.length} product${plural} dropped to or below your threshold of ${opts.threshold}.</p>
  <table style="border-collapse:collapse;min-width:280px">
    <thead><tr>
      <th style="text-align:left;padding:6px 12px;border-bottom:2px solid #241f16">Product</th>
      <th style="text-align:right;padding:6px 12px;border-bottom:2px solid #241f16">Stock left</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:16px;color:#888;font-size:13px">Restock these from the admin Inventory screen.</p>
</body></html>`;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: {
        name: opts.storeName || "Packaging Ambassadors",
        email: opts.fromAddress || "orders@packagingambassadors.com",
      },
      to: [{ email: opts.storeEmail }],
      subject: `Low stock: ${opts.items.length} product${plural} need restocking`,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    console.error("[low-stock] Brevo send failed", res.status, await res.text());
    return false;
  }
  return true;
}
