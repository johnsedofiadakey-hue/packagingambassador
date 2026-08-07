import { NextResponse } from "next/server";
import { getAdminDb, verifyActiveStaff } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  // POS is a staff tool — it creates fulfilled orders, deducts stock, and books
  // revenue with no payment step, so it must never be callable anonymously.
  const uid = await verifyActiveStaff(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { channel, customer, lines, subtotal, paymentMethod } = body;

    const db = getAdminDb();
    
    // Generate POS ID: POS- + 8 random uppercase chars
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let randomStr = "";
    for (let i = 0; i < 8; i++) {
      randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const orderId = `POS-${randomStr}`;

    const collectionName = channel === "wholesale" ? "wholesaleOrders" : "orders";

    // Build the order document based on channel
    const orderData: any = {
      id: orderId,
      createdAt: new Date().toISOString(),
      phone: customer?.phone || "N/A",
      lines,
      subtotal,
      status: "Delivered", // Immediately fulfilled for POS
      paymentMethod, // 'pos-cash', 'pos-momo', 'pos-card'
      serverValidated: true
    };

    if (channel === "wholesale") {
      orderData.businessName = customer?.name || "Walk-in Business";
      orderData.contactName = customer?.name || "Walk-in Contact";
      orderData.deliveryAddress = "POS Pickup";
    } else {
      orderData.customerName = customer?.name || "Walk-in Customer";
      orderData.address = "POS Pickup";
    }

    const batch = db.batch();
    
    // 1. Create order
    const orderRef = db.collection(collectionName).doc(orderId);
    batch.set(orderRef, orderData);

    // 2. Deduct stock and increment units sold
    for (const line of lines) {
      const productRef = db.collection("products").doc(line.slug);
      batch.update(productRef, {
        stock: FieldValue.increment(-line.quantity),
        unitsSold: FieldValue.increment(line.quantity)
      });
    }

    // 3. Bump revenue stats — must match the monthly, per-channel rollup the
    //    analytics dashboard reads (revenueStats/{YYYY-MM} with {retail|wholesale}
    //    fields). Writing a daily doc or differently-named fields makes POS revenue
    //    invisible to the BI dashboard.
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    const channelKey = channel === "wholesale" ? "wholesale" : "retail";
    const statsRef = db.collection("revenueStats").doc(monthKey);
    batch.set(statsRef, { [channelKey]: FieldValue.increment(subtotal) }, { merge: true });

    await batch.commit();

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("POS Checkout error:", error);
    return NextResponse.json({ error: "Failed to process sale" }, { status: 500 });
  }
}
