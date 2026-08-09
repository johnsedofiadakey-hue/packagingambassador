import { formatPrice } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { renderBrandedEmail, DEFAULT_EMAIL_THEME, type EmailTheme } from "@/lib/notifications/email-shell";
import type { CartLine } from "@/lib/cart-context";

export type OrderTheme = EmailTheme;

export type OrderConfirmationRequest = {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  subtotal: number;
  lines?: CartLine[];
  smsSenderId?: string;
  emailFromAddress?: string;
  storeEmail?: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
  theme?: OrderTheme;
};

function trackingUrl(orderId: string) {
  return `${SITE_URL}/track?order=${encodeURIComponent(orderId)}`;
}

async function sendSms(body: OrderConfirmationRequest) {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) {
    console.warn("[notifications] ARKESEL_API_KEY not set — skipping SMS.");
    return false;
  }

  const message = `Hi ${body.customerName}, thanks for your order #${body.orderId} (${formatPrice(body.subtotal)}) with ${body.storeName || "Packaging Ambassadors"}. Track it here: ${trackingUrl(body.orderId)}`;

  const res = await fetch("https://sms.arkesel.com/api/v2/sms/send", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: body.smsSenderId || "PackAmb",
      message,
      recipients: [body.phone],
    }),
  });

  if (!res.ok) {
    console.error("[notifications] Arkesel SMS failed", res.status, await res.text());
    return false;
  }
  return true;
}

function buildOrderEmailHtml(body: OrderConfirmationRequest) {
  const theme = body.theme ?? DEFAULT_EMAIL_THEME;
  const lines = body.lines ?? [];
  const track = trackingUrl(body.orderId);

  const itemRows = lines
    .map(
      (line) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ece2d0;font-size:14px;color:${theme.textColor};">
            ${line.name}${line.color ? ` · ${line.color}` : ""}${line.size ? ` · ${line.size}` : ""} × ${line.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #ece2d0;font-size:14px;color:${theme.textColor};text-align:right;white-space:nowrap;">
            ${formatPrice(line.price * line.quantity)}
          </td>
        </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.primaryColor};">
      Order Confirmed
    </p>
    <h1 style="margin:0 0 16px;font-size:22px;color:${theme.textColor};">
      Thanks, ${body.customerName}!
    </h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${theme.textColor};opacity:0.85;">
      We've received your order and our team will be in touch shortly to confirm delivery
      and payment. You can follow its progress any time using the button below.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      ${itemRows}
      <tr>
        <td style="padding:14px 0 0;font-size:15px;font-weight:bold;color:${theme.textColor};">Total</td>
        <td style="padding:14px 0 0;font-size:15px;font-weight:bold;color:${theme.textColor};text-align:right;">${formatPrice(body.subtotal)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fbf3e6;border-radius:12px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 2px;font-size:11px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.textColor};opacity:0.6;">
            Your tracking number
          </p>
          <p style="margin:0;font-size:17px;font-weight:bold;letter-spacing:0.03em;color:${theme.textColor};">
            ${body.orderId}
          </p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;">
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
    contact: {
      storeName: body.storeName || "Packaging Ambassadors",
      storePhone: body.storePhone,
      storeEmail: body.storeEmail,
      storeAddress: body.storeAddress,
    },
    footer: "customer",
    preheader: `Order ${body.orderId} confirmed — total ${formatPrice(body.subtotal)}. Track it any time.`,
    bodyHtml,
  });
}

async function sendEmail(body: OrderConfirmationRequest) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("[notifications] BREVO_API_KEY not set — skipping email.");
    return false;
  }

  const from = body.emailFromAddress || "orders@packagingambassadors.com";
  const storeName = body.storeName || "Packaging Ambassadors";
  const recipients = [body.email, body.storeEmail].filter((addr): addr is string => Boolean(addr));
  if (recipients.length === 0) return false;

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: storeName, email: from },
      to: recipients.map((email) => ({ email })),
      subject: `Order ${body.orderId} confirmed — ${storeName}`,
      htmlContent: buildOrderEmailHtml(body),
    }),
  });

  if (!res.ok) {
    console.error("[notifications] Brevo email failed", res.status, await res.text());
    return false;
  }
  return true;
}

export async function sendOrderConfirmation(body: OrderConfirmationRequest) {
  const [smsSent, emailSent] = await Promise.all([
    sendSms(body).catch((err) => {
      console.error("[notifications] SMS send threw", err);
      return false;
    }),
    sendEmail(body).catch((err) => {
      console.error("[notifications] Email send threw", err);
      return false;
    }),
  ]);

  return { smsSent, emailSent };
}
