import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import {
  createPaidOrderIfNotExists,
  createPaidWholesaleOrderIfNotExists,
  isValidCartLine,
  verifyPaystackCharge,
} from "@/lib/payments/create-paid-order";

const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`paystack-verify:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const channel = body?.channel === "wholesale" ? "wholesale" : "retail";
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const customer = body?.customer;
  const lines = Array.isArray(body?.lines) ? body.lines : null;
  const subtotal = typeof body?.subtotal === "number" ? body.subtotal : NaN;

  const validCustomer =
    channel === "wholesale"
      ? customer &&
        typeof customer.businessName === "string" &&
        typeof customer.contactName === "string" &&
        typeof customer.phone === "string" &&
        typeof customer.deliveryAddress === "string" &&
        (customer.email === undefined || typeof customer.email === "string")
      : customer &&
        typeof customer.name === "string" &&
        typeof customer.phone === "string" &&
        typeof customer.address === "string" &&
        (customer.email === undefined || typeof customer.email === "string");

  if (
    !reference ||
    !validCustomer ||
    !lines ||
    lines.length === 0 ||
    !lines.every(isValidCartLine) ||
    !Number.isFinite(subtotal) ||
    subtotal <= 0
  ) {
    return NextResponse.json({ error: "Invalid order details." }, { status: 400 });
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Please contact us to complete your order." },
      { status: 503 }
    );
  }

  const verifyResult = await verifyPaystackCharge(reference, Math.round(subtotal * 100), secretKey);
  if (!verifyResult.ok) {
    return NextResponse.json({ error: verifyResult.error }, { status: verifyResult.status });
  }

  const settingsSnap = await getAdminDb().collection("settings").doc("store").get().catch(() => null);
  const settingsData = settingsSnap?.data();
  const checkoutWasLocked =
    channel === "wholesale"
      ? settingsData?.wholesaleCheckoutLocked === true
      : settingsData?.checkoutLocked === true;

  const { order } =
    channel === "wholesale"
      ? await createPaidWholesaleOrderIfNotExists({ reference, customer, lines, subtotal, checkoutWasLocked })
      : await createPaidOrderIfNotExists({ reference, customer, lines, subtotal, checkoutWasLocked });

  return NextResponse.json(order);
}
