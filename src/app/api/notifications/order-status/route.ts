import { NextResponse } from "next/server";
import { getAdminDb, verifyActiveStaff } from "@/lib/firebase-admin";
import { shouldSend } from "@/lib/notifications/idempotency";
import { sendOrderStatusUpdate, type NotifiableStatus } from "@/lib/notifications/send-order-status";

const NOTIFIABLE: NotifiableStatus[] = ["Processing", "Delivered"];

/**
 * Fired by the admin Orders screen right after a status change. Staff-gated. Reads the order
 * (and store settings) server-side rather than trusting the client, then emails the customer —
 * once per order+status. A no-op for statuses we don't notify on (Pending, Cancelled), so the
 * caller can fire it unconditionally.
 */
export async function POST(request: Request) {
  const uid = await verifyActiveStaff(request);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let payload: { orderId?: string; channel?: "retail" | "wholesale"; status?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { orderId, channel, status } = payload;
  if (!orderId || !channel || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!NOTIFIABLE.includes(status as NotifiableStatus)) {
    return NextResponse.json({ ok: true, emailSent: false, skipped: "status-not-notified" });
  }

  const db = getAdminDb();
  const collection = channel === "wholesale" ? "wholesaleOrders" : "orders";
  const orderSnap = await db.collection(collection).doc(orderId).get().catch(() => null);
  if (!orderSnap?.exists) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const order = orderSnap.data() ?? {};
  const email: string | undefined = typeof order.email === "string" ? order.email : undefined;
  if (!email) {
    return NextResponse.json({ ok: true, emailSent: false, skipped: "no-customer-email" });
  }
  const customerName: string =
    (typeof order.customerName === "string" && order.customerName) ||
    (typeof order.contactName === "string" && order.contactName) ||
    "there";

  // One email per order+status transition — distinct namespace from the confirmation key (= orderId).
  if (!(await shouldSend(`status:${orderId}:${status}`))) {
    return NextResponse.json({ ok: true, emailSent: false, alreadySent: true });
  }

  const settingsSnap = await db.collection("settings").doc("store").get().catch(() => null);
  const settings = settingsSnap?.data() ?? {};

  const emailSent = await sendOrderStatusUpdate({
    orderId,
    customerName,
    status: status as NotifiableStatus,
    email,
    theme: settings.theme,
    emailFromAddress: settings.emailFromAddress,
    contact: {
      storeName: settings.storeName,
      storePhone: settings.storePhone,
      storeEmail: settings.storeEmail,
      storeAddress: settings.storeAddress,
    },
  }).catch((err) => {
    console.error("[order-status] send failed", err);
    return false;
  });

  return NextResponse.json({ ok: true, emailSent });
}
