import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

const GENERIC_ERROR = "We couldn't find an order with that number — check it and try again.";
const RATE_LIMIT = 12;
const RATE_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`track:${ip}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim().toUpperCase() : "";

  if (!orderId) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  let snap;
  let isWholesale = false;
  try {
    const db = getAdminDb();
    snap = await db.collection("orders").doc(orderId).get();
    if (!snap.exists) {
      // Same order-ID scheme, different collection — a wholesale customer uses this exact
      // same tracking page and form, no separate flow.
      snap = await db.collection("wholesaleOrders").doc(orderId).get();
      if (snap.exists) isWholesale = true;
    }
  } catch {
    return NextResponse.json(
      { error: "Tracking is temporarily unavailable. Please try again shortly." },
      { status: 500 }
    );
  }

  if (!snap.exists) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 404 });
  }

  const order = snap.data()!;

  return NextResponse.json({
    id: snap.id,
    status: order.status,
    createdAt: order.createdAt,
    lines: order.lines,
    subtotal: order.subtotal,
    isWholesale,
  });
}
