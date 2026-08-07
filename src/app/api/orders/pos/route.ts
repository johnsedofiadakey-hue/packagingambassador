import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
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

    // 3. Bump revenue stats
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const statsRef = db.collection("revenueStats").doc(date);
    batch.set(statsRef, {
      revenue: FieldValue.increment(subtotal),
      ordersCount: FieldValue.increment(1)
    }, { merge: true });

    await batch.commit();

    return NextResponse.json({ success: true, orderId });
  } catch (error) {
    console.error("POS Checkout error:", error);
    return NextResponse.json({ error: "Failed to process sale" }, { status: 500 });
  }
}
