import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const GENERIC_ERROR = "We couldn't find an order with that number — check it and try again.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId.trim().toUpperCase() : "";

  if (!orderId) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  let snap;
  try {
    snap = await getAdminDb().collection("orders").doc(orderId).get();
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
  });
}
