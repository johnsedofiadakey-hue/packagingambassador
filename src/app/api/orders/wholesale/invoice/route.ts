import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { settleInventoryForOrder } from "@/lib/inventory/stock";
import { rateLimit } from "@/lib/rate-limit";

/**
 * B2B "pay by invoice" checkout — creates an unpaid wholesale order (no Paystack).
 * Deliberately conforms to the SAME schema the Paystack path writes
 * (createPaidWholesaleOrderIfNotExists): flat customer fields on the order, the
 * `businessCustomers` collection keyed by phone, ISO-string timestamps. Any drift
 * here silently breaks the admin orders view, the customer directory, and the
 * invoice/waybill pages, all of which read that one shape.
 */
export async function POST(req: Request) {
  // Public, unpaid order creation that deducts stock — rate-limit per IP so it
  // can't be scripted to spam orders or drain inventory. Tighter than /track's
  // read limit since this one mutates.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = rateLimit(`wholesale-invoice:${ip}`, 6, 60 * 60 * 1000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many invoice requests. Please wait a bit before trying again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  try {
    const { customer, lines, subtotal } = await req.json();

    if (!customer || !lines || !lines.length || !subtotal) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const db = getAdminDb();
    const now = new Date().toISOString();

    // Order doc — flat customer fields, matching WholesaleOrder used everywhere else.
    const orderRef = db.collection("wholesaleOrders").doc();
    await orderRef.set({
      id: orderRef.id,
      createdAt: now,
      businessName: customer.businessName,
      contactName: customer.contactName,
      phone: customer.phone,
      deliveryAddress: customer.deliveryAddress,
      lines,
      subtotal,
      status: "Pending", // Bypassed Paystack — unpaid until settled.
      paymentMethod: "invoice",
      ...(customer.email ? { email: customer.email } : {}),
      ...(customer.billingAddress ? { billingAddress: customer.billingAddress } : {}),
    });

    // Upsert the business customer in the SAME collection + doc-id convention as the
    // Paystack path (businessCustomers, keyed by phone) so invoice and paid orders
    // roll up into one record and appear in the admin customer directory.
    const customerRef = db.collection("businessCustomers").doc(customer.phone);
    const customerSnap = await customerRef.get();
    await customerRef.set(
      {
        businessName: customer.businessName,
        contactName: customer.contactName,
        phone: customer.phone,
        deliveryAddress: customer.deliveryAddress,
        ...(customer.email ? { email: customer.email } : {}),
        ...(customer.billingAddress ? { billingAddress: customer.billingAddress } : {}),
        orderCount: FieldValue.increment(1),
        totalSpent: FieldValue.increment(subtotal),
        // firstOrderAt must only ever be written once.
        ...(customerSnap.exists ? {} : { firstOrderAt: now }),
        lastOrderAt: now,
      },
      { merge: true }
    );

    // Atomic stock decrement (+ unitsSold), oversell detection, and low-stock alerts —
    // the same settlement every order path uses.
    const shortfalls = await settleInventoryForOrder(db, lines);
    if (shortfalls.length > 0) {
      await orderRef
        .update({ needsStockReview: true, stockShortfall: shortfalls })
        .catch((err) => console.error("[wholesale invoice] failed to flag shortfall", err));
    }

    return NextResponse.json({ id: orderRef.id, subtotal, lines });
  } catch (err) {
    console.error("Error creating wholesale invoice order:", err);
    return NextResponse.json({ error: "Server error creating order." }, { status: 500 });
  }
}
