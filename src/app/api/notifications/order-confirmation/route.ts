import { NextResponse } from "next/server";
import { formatPrice } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import type { CartLine } from "@/lib/cart-context";

type OrderTheme = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
};

type OrderConfirmationRequest = {
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
  const storeName = body.storeName || "Packaging Ambassadors";
  const theme: OrderTheme = body.theme ?? {
    primaryColor: "#dd8f2e",
    secondaryColor: "#283a17",
    accentColor: "#e2791f",
    textColor: "#241f16",
    backgroundColor: "#fffbf4",
  };
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

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background-color:#f3e4cc;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3e4cc;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background-color:${theme.backgroundColor};border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:${theme.primaryColor};padding:24px 28px;text-align:center;">
                <img src="${SITE_URL}/logo.png" alt="${storeName}" width="40" height="60" style="display:inline-block;vertical-align:middle;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:18px;font-weight:bold;color:#ffffff;">
                  ${storeName}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:bold;letter-spacing:0.06em;text-transform:uppercase;color:${theme.primaryColor};">
                  Order Confirmed
                </p>
                <h1 style="margin:0 0 16px;font-size:22px;color:${theme.textColor};">
                  Thanks, ${body.customerName}!
                </h1>
                <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:${theme.textColor};opacity:0.85;">
                  We've received your order and our team will be in touch shortly to confirm delivery
                  and payment.
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
                </table>
              </td>
            </tr>
            <tr>
              <td style="background-color:${theme.secondaryColor};padding:18px 28px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#ffffff;opacity:0.85;">
                  ${storeName} — Ghana's Packaging Partner
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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

export async function POST(request: Request) {
  let body: OrderConfirmationRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.orderId || !body.customerName || !body.phone) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

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

  return NextResponse.json({ ok: true, smsSent, emailSent });
}
