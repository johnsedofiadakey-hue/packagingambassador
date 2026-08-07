import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { customer, lines, subtotal } = await req.json();

    if (!customer || !lines || !lines.length || !subtotal) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const db = getAdminDb();

    // Create the order doc
    const orderRef = db.collection("wholesaleOrders").doc();
    await orderRef.set({
      customer,
      lines,
      subtotal,
      status: "Pending", // Bypassed Paystack, so it's Pending, not Paid
      paymentMethod: "invoice",
      createdAt: FieldValue.serverTimestamp(),
    });

    // Update customer stats
    const customerRef = db.collection("business_customers").doc(customer.email || customer.phone);
    await db.runTransaction(async (t) => {
      const doc = await t.get(customerRef);
      if (!doc.exists) {
        t.set(customerRef, {
          businessName: customer.businessName,
          contactName: customer.contactName,
          phone: customer.phone,
          email: customer.email || null,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
          orderCount: 1,
          totalSpent: subtotal,
          firstOrderAt: FieldValue.serverTimestamp(),
          lastOrderAt: FieldValue.serverTimestamp(),
        });
      } else {
        const data = doc.data();
        t.update(customerRef, {
          businessName: customer.businessName,
          contactName: customer.contactName,
          deliveryAddress: customer.deliveryAddress,
          billingAddress: customer.billingAddress,
          orderCount: (data?.orderCount || 0) + 1,
          totalSpent: (data?.totalSpent || 0) + subtotal,
          lastOrderAt: FieldValue.serverTimestamp(),
        });
      }
    });

    // Deduct stock
    const perSlug = new Map<string, number>();
    for (const line of lines) {
      perSlug.set(line.slug, (perSlug.get(line.slug) ?? 0) + line.quantity);
    }
    await Promise.all(
      [...perSlug].map(([slug, qty]) =>
        db.collection("products").doc(slug).update({ stock: FieldValue.increment(-qty) })
        .catch((err) => console.error("[deductStock] failed", slug, err))
      )
    );

    return NextResponse.json({ id: orderRef.id, subtotal, lines });
  } catch (err: any) {
    console.error("Error creating wholesale invoice order:", err);
    return NextResponse.json({ error: "Server error creating order." }, { status: 500 });
  }
}
