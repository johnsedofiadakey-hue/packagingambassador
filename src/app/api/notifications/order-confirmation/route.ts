import { NextResponse } from "next/server";
import { shouldSend } from "@/lib/notifications/idempotency";
import { sendOrderConfirmation, type OrderConfirmationRequest } from "@/lib/notifications/send-order-confirmation";

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

  if (!(await shouldSend(body.orderId))) {
    return NextResponse.json({ ok: true, smsSent: false, emailSent: false, alreadySent: true });
  }

  const { smsSent, emailSent } = await sendOrderConfirmation(body);

  return NextResponse.json({ ok: true, smsSent, emailSent });
}
