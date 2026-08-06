import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";
import { createPaidOrderIfNotExists, isValidCartLine } from "@/lib/payments/create-paid-order";

const GENERIC_ERROR = "We couldn't confirm your payment. Please try again or contact us.";
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
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const customer = body?.customer;
  const lines = Array.isArray(body?.lines) ? body.lines : null;
  const subtotal = typeof body?.subtotal === "number" ? body.subtotal : NaN;

  const validCustomer =
    customer &&
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

  let verifyRes;
  try {
    verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach Paystack to verify payment. Please try again shortly." },
      { status: 502 }
    );
  }

  if (!verifyRes.ok) {
    console.error("[paystack] verify request failed", verifyRes.status, await verifyRes.text());
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 502 });
  }

  const verifyJson = await verifyRes.json().catch(() => null);
  const data = verifyJson?.data;
  const expectedAmount = Math.round(subtotal * 100);

  if (
    !data ||
    data.status !== "success" ||
    data.currency !== "GHS" ||
    data.amount !== expectedAmount
  ) {
    console.error("[paystack] verification mismatch", { reference, data, expectedAmount });
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 402 });
  }

  const settingsSnap = await getAdminDb().collection("settings").doc("store").get().catch(() => null);
  const checkoutWasLocked = settingsSnap?.data()?.checkoutLocked === true;

  const { order } = await createPaidOrderIfNotExists({
    reference,
    customer,
    lines,
    subtotal,
    checkoutWasLocked,
  });

  return NextResponse.json(order);
}
