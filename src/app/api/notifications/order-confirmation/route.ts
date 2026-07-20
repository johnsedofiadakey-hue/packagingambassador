import { NextResponse } from "next/server";

type OrderConfirmationRequest = {
  orderId: string;
  customerName: string;
  phone: string;
  email?: string;
  subtotal: number;
  smsSenderId?: string;
  emailFromAddress?: string;
  storeEmail?: string;
};

async function sendSms(body: OrderConfirmationRequest) {
  const apiKey = process.env.ARKESEL_API_KEY;
  if (!apiKey) {
    console.warn("[notifications] ARKESEL_API_KEY not set — skipping SMS.");
    return false;
  }

  const message = `Hi ${body.customerName}, thanks for your order #${body.orderId} (GH₵${body.subtotal}) with Packaging Ambassadors. We'll be in touch to confirm delivery and payment.`;

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

async function sendEmail(body: OrderConfirmationRequest) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[notifications] RESEND_API_KEY not set — skipping email.");
    return false;
  }

  const from = body.emailFromAddress || "orders@packagingambassadors.com";
  const recipients = [body.email, body.storeEmail].filter((addr): addr is string => Boolean(addr));
  if (recipients.length === 0) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: recipients,
      subject: `Order ${body.orderId} confirmed — Packaging Ambassadors`,
      html: `<p>Hi ${body.customerName},</p><p>Thanks for your order <strong>#${body.orderId}</strong> — total <strong>GH₵${body.subtotal}</strong>.</p><p>Our team will reach out shortly to confirm delivery and payment.</p>`,
    }),
  });

  if (!res.ok) {
    console.error("[notifications] Resend email failed", res.status, await res.text());
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
