import { SITE_URL } from "@/lib/site";
import { renderBrandedEmail, DEFAULT_EMAIL_THEME, type EmailTheme, type EmailContact } from "@/lib/notifications/email-shell";

/** Only these two transitions email the customer — Pending is the initial state and
 *  Cancelled is handled by a conversation, not an automated "good news" note. */
export type NotifiableStatus = "Processing" | "Delivered";

export type OrderStatusRequest = {
  orderId: string;
  customerName: string;
  status: NotifiableStatus;
  email?: string;
  theme?: EmailTheme;
  emailFromAddress?: string;
  contact: EmailContact;
};

function trackingUrl(orderId: string) {
  return `${SITE_URL}/track?order=${encodeURIComponent(orderId)}`;
}

const COPY: Record<
  NotifiableStatus,
  { eyebrow: string; heading: (name: string) => string; message: (id: string, store: string) => string; subject: (id: string) => string; preheader: (id: string) => string }
> = {
  Processing: {
    eyebrow: "Order Update",
    heading: (name) => `Good news, ${name} — it's being prepared`,
    message: (id) =>
      `Your order <strong>${id}</strong> is now being prepared for delivery. We'll let you know the moment it's on its way.`,
    subject: (id) => `Your order ${id} is being prepared`,
    preheader: (id) => `Order ${id} is being prepared for delivery.`,
  },
  Delivered: {
    eyebrow: "Delivered",
    heading: (name) => `Delivered — thank you, ${name}!`,
    message: (id, store) =>
      `Order <strong>${id}</strong> has been delivered. Thank you for choosing ${store}! If anything isn't quite right, just reply to this email or give us a call — we're happy to help.`,
    subject: (id) => `Your order ${id} has been delivered`,
    preheader: (id) => `Order ${id} has been delivered. Thank you!`,
  },
};

function buildStatusEmailHtml(body: OrderStatusRequest) {
  const theme = body.theme ?? DEFAULT_EMAIL_THEME;
  const copy = COPY[body.status];
  const track = trackingUrl(body.orderId);
  const storeName = body.contact.storeName || "Packaging Ambassadors";

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.primaryColor};">
      ${copy.eyebrow}
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;color:${theme.textColor};">
      ${copy.heading(body.customerName)}
    </h1>
    <p style="margin:0 0 22px;font-size:14px;line-height:1.6;color:${theme.textColor};opacity:0.85;">
      ${copy.message(body.orderId, storeName)}
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${track}" style="display:inline-block;background-color:${theme.primaryColor};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:13px 32px;border-radius:999px;">
            Track My Order
          </a>
        </td>
      </tr>
    </table>`;

  return renderBrandedEmail({
    theme,
    contact: body.contact,
    footer: "customer",
    preheader: copy.preheader(body.orderId),
    bodyHtml,
  });
}

/**
 * Emails the customer when an order moves to Processing or Delivered. Best-effort — a missing
 * BREVO_API_KEY, no customer email on file, or a send failure never blocks the status change
 * that triggered it. Idempotency is enforced by the caller (one send per order+status).
 */
export async function sendOrderStatusUpdate(body: OrderStatusRequest): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[order-status] BREVO_API_KEY not set — skipping email.");
    return false;
  }
  if (!body.email) return false;

  const storeName = body.contact.storeName || "Packaging Ambassadors";
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { name: storeName, email: body.emailFromAddress || "orders@packagingambassadors.com" },
      to: [{ email: body.email }],
      subject: COPY[body.status].subject(body.orderId),
      htmlContent: buildStatusEmailHtml(body),
    }),
  });

  if (!res.ok) {
    console.error("[order-status] Brevo send failed", res.status, await res.text());
    return false;
  }
  return true;
}
