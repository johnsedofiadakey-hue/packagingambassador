import type { LowStockItem } from "@/lib/inventory/stock";
import { SITE_URL } from "@/lib/site";
import { renderBrandedEmail, DEFAULT_EMAIL_THEME, type EmailTheme } from "@/lib/notifications/email-shell";

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
  theme?: EmailTheme;
}): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[low-stock] BREVO_API_KEY not set — skipping alert.");
    return false;
  }
  if (opts.items.length === 0 || !opts.storeEmail) return false;

  const theme = opts.theme ?? DEFAULT_EMAIL_THEME;
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #ece2d0;font-size:14px;color:${theme.textColor}">${i.name}</td>` +
        `<td style="padding:8px 0;border-bottom:1px solid #ece2d0;text-align:right;font-weight:700;font-size:14px;color:${i.stock <= 0 ? "#dc2626" : "#b45309"}">${i.stock}</td></tr>`
    )
    .join("");

  const plural = opts.items.length === 1 ? "" : "s";
  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.primaryColor};">
      Low Stock Alert
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;color:${theme.textColor};">
      ${opts.items.length} product${plural} need restocking
    </h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${theme.textColor};opacity:0.85;">
      These dropped to or below your low-stock threshold of ${opts.threshold}.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px;">
      <tr>
        <td style="padding:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.textColor};opacity:0.55;border-bottom:2px solid ${theme.textColor};">Product</td>
        <td style="padding:0 0 6px;font-size:11px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.textColor};opacity:0.55;text-align:right;border-bottom:2px solid ${theme.textColor};">Stock left</td>
      </tr>
      ${rows}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${SITE_URL}/admin/inventory" style="display:inline-block;background-color:${theme.primaryColor};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:13px 32px;border-radius:999px;">
            Open Inventory
          </a>
        </td>
      </tr>
    </table>`;

  const html = renderBrandedEmail({
    theme,
    contact: { storeName: opts.storeName || "Packaging Ambassadors" },
    footer: "internal",
    preheader: `${opts.items.length} product${plural} at or below threshold ${opts.threshold}.`,
    bodyHtml,
  });

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
