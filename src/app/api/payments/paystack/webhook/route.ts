import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  createPaidOrderIfNotExists,
  createPaidWholesaleOrderIfNotExists,
  isValidCartLine,
} from "@/lib/payments/create-paid-order";
import { shouldSend } from "@/lib/notifications/idempotency";
import { sendOrderConfirmation } from "@/lib/notifications/send-order-confirmation";

/**
 * Recovery path, not the primary flow — see /api/payments/paystack/verify for that. Paystack
 * calls this server-to-server after a real charge succeeds, independent of the customer's
 * browser. It only ever does something if `verify` never ran (e.g. the browser dropped the
 * connection right after Paystack charged the card): in that case this reconstructs the order
 * from the charge's metadata and flags it `webhookReconstructed` for staff to double-check.
 * Handles both retail and wholesale, branching on `metadata.channel`.
 */
export async function POST(request: Request) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error("[paystack webhook] PAYSTACK_SECRET_KEY not set — rejecting.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expectedSignature = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex");

  const signatureValid =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!signatureValid) {
    console.error("[paystack webhook] signature mismatch");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event?.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const data = event.data ?? {};
  const reference = typeof data.reference === "string" ? data.reference : "";
  const metadata = data.metadata ?? {};
  const channel = metadata.channel === "wholesale" ? "wholesale" : "retail";
  const customer = metadata.customer;
  const lines = Array.isArray(metadata.lines) ? metadata.lines : null;
  const subtotal = typeof metadata.subtotal === "number" ? metadata.subtotal : NaN;

  const validCustomer =
    channel === "wholesale"
      ? customer &&
        typeof customer.businessName === "string" &&
        typeof customer.contactName === "string" &&
        typeof customer.phone === "string" &&
        typeof customer.deliveryAddress === "string"
      : customer &&
        typeof customer.name === "string" &&
        typeof customer.phone === "string" &&
        typeof customer.address === "string";

  if (
    !reference ||
    !validCustomer ||
    !lines ||
    lines.length === 0 ||
    !lines.every(isValidCartLine) ||
    !Number.isFinite(subtotal) ||
    subtotal <= 0
  ) {
    console.error(
      "[paystack webhook] charge.success with unusable metadata — cannot reconstruct order, needs manual reconciliation",
      { reference, channel }
    );
    return NextResponse.json({ received: true, warning: "insufficient metadata to reconstruct order" });
  }

  const { order, created } =
    channel === "wholesale"
      ? await createPaidWholesaleOrderIfNotExists({ reference, customer, lines, subtotal, reconstructed: true })
      : await createPaidOrderIfNotExists({ reference, customer, lines, subtotal, reconstructed: true });

  if (created) {
    // The normal client-triggered notification never fired for this order — send it here.
    const settingsSnap = await getAdminDb().collection("settings").doc("store").get().catch(() => null);
    const settings = settingsSnap?.data() ?? {};
    const customerName = channel === "wholesale" ? customer.contactName : customer.name;

    if (await shouldSend(order.id)) {
      await sendOrderConfirmation({
        orderId: order.id,
        customerName,
        phone: customer.phone,
        email: customer.email,
        subtotal: order.subtotal,
        lines: order.lines,
        smsSenderId: settings.smsSenderId,
        emailFromAddress: settings.emailFromAddress,
        storeEmail: settings.storeEmail,
        storeName: settings.storeName,
        storePhone: settings.storePhone,
        storeAddress: settings.storeAddress,
        theme: settings.theme,
      }).catch((err) => console.error("[paystack webhook] confirmation send failed", err));
    }
  }

  return NextResponse.json({ received: true, orderId: order.id, created });
}
