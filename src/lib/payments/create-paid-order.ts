import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { CartLine } from "@/lib/cart-context";

export const GENERIC_PAYMENT_ERROR = "We couldn't confirm your payment. Please try again or contact us.";

function generateOrderId(prefix: "ORD" | "WHS") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

/**
 * Bump each ordered product's lifetime `unitsSold` counter (powers best-sellers without
 * reducing over the whole orders collection). Quantities are aggregated per slug first — a
 * batch can't write the same doc twice when one order has two lines of the same product.
 * Called only when an order is genuinely created, never on an idempotent re-resolve.
 */
async function incrementUnitsSold(db: Firestore, lines: CartLine[]) {
  const perSlug = new Map<string, number>();
  for (const line of lines) {
    perSlug.set(line.slug, (perSlug.get(line.slug) ?? 0) + line.quantity);
  }
  await Promise.all(
    [...perSlug].map(([slug, qty]) =>
      db.collection("products").doc(slug).update({ unitsSold: FieldValue.increment(qty) })
      // A line referencing a since-deleted product shouldn't fail the whole order.
      .catch((err) => console.error("[unitsSold] increment failed", slug, err))
    )
  );
}

async function deductStock(db: Firestore, lines: CartLine[]) {
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
}

/**
 * Bump the monthly revenue rollup. A `revenueStats/{YYYY-MM}` doc holds per-channel running
 * totals, so the analytics dashboard reads ~6 tiny docs for a revenue trend instead of running
 * a per-month aggregation query (which Firestore would require a composite index for). Same
 * write-time-counter idea as unitsSold — index-free and scale-free.
 */
async function bumpRevenueStats(
  db: Firestore,
  channel: "retail" | "wholesale",
  subtotal: number,
  createdAtIso: string
) {
  const monthKey = createdAtIso.slice(0, 7); // "YYYY-MM"
  await db
    .collection("revenueStats")
    .doc(monthKey)
    .set({ [channel]: FieldValue.increment(subtotal) }, { merge: true })
    .catch((err) => console.error("[revenueStats] increment failed", monthKey, err));
}

export function isValidCartLine(line: unknown): line is CartLine {
  if (!line || typeof line !== "object") return false;
  const l = line as Record<string, unknown>;
  return (
    typeof l.slug === "string" &&
    typeof l.name === "string" &&
    typeof l.price === "number" &&
    typeof l.unit === "string" &&
    typeof l.size === "string" &&
    typeof l.color === "string" &&
    typeof l.quantity === "number"
  );
}

export type VerifyChargeResult = { ok: true } | { ok: false; status: number; error: string };

/**
 * The one security-critical check both channels share: does Paystack actually confirm this
 * reference was charged, for exactly the amount we expect, in the right currency. Kept as a
 * single function so retail and wholesale can never drift into two different versions of
 * "verified" — the mistake worth avoiding here.
 */
export async function verifyPaystackCharge(
  reference: string,
  expectedAmountPesewas: number,
  secretKey: string
): Promise<VerifyChargeResult> {
  let verifyRes;
  try {
    verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } }
    );
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Couldn't reach Paystack to verify payment. Please try again shortly.",
    };
  }

  if (!verifyRes.ok) {
    console.error("[paystack] verify request failed", verifyRes.status, await verifyRes.text());
    return { ok: false, status: 502, error: GENERIC_PAYMENT_ERROR };
  }

  const verifyJson = await verifyRes.json().catch(() => null);
  const data = verifyJson?.data;

  if (
    !data ||
    data.status !== "success" ||
    data.currency !== "GHS" ||
    data.amount !== expectedAmountPesewas
  ) {
    console.error("[paystack] verification mismatch", { reference, data, expectedAmountPesewas });
    return { ok: false, status: 402, error: GENERIC_PAYMENT_ERROR };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Retail
// ---------------------------------------------------------------------------

export type PaidOrderCustomer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
};

export type PaidOrderInput = {
  reference: string;
  customer: PaidOrderCustomer;
  lines: CartLine[];
  subtotal: number;
  /** Set only by the webhook fallback path — never by the primary verify route. */
  reconstructed?: boolean;
  /** Whether checkoutLocked was true in settings at the moment this order landed. */
  checkoutWasLocked?: boolean;
};

export type PaidOrderResult = {
  id: string;
  status: "Processing";
  createdAt: string;
  lines: CartLine[];
  subtotal: number;
};

/**
 * Idempotent on `paystackReference` — a retried verify call or a webhook arriving after
 * the primary path already succeeded both resolve to the same order, never a duplicate.
 */
export async function createPaidOrderIfNotExists(
  input: PaidOrderInput
): Promise<{ order: PaidOrderResult; created: boolean }> {
  const db = getAdminDb();

  const existing = await db
    .collection("orders")
    .where("paystackReference", "==", input.reference)
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();
    return {
      order: {
        id: doc.id,
        status: data.status,
        createdAt: data.createdAt,
        lines: data.lines,
        subtotal: data.subtotal,
      },
      created: false,
    };
  }

  const id = generateOrderId("ORD");
  const now = new Date().toISOString();
  const order = {
    id,
    createdAt: now,
    customerName: input.customer.name,
    phone: input.customer.phone,
    address: input.customer.address,
    lines: input.lines,
    subtotal: input.subtotal,
    status: "Processing" as const,
    paystackReference: input.reference,
    paidAt: now,
    // Firestore's Admin SDK (unlike the client SDK) rejects an explicit `undefined` value
    // outright — every optional field must be omitted entirely, not set to undefined.
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.reconstructed ? { serverValidated: false, webhookReconstructed: true } : {}),
    ...(input.checkoutWasLocked ? { orderedWhileLocked: true } : {}),
  };

  await db.collection("orders").doc(id).set(order);
  await Promise.all([
    incrementUnitsSold(db, input.lines),
    deductStock(db, input.lines),
    bumpRevenueStats(db, "retail", input.subtotal, now),
  ]);

  return {
    order: { id: order.id, status: order.status, createdAt: order.createdAt, lines: order.lines, subtotal: order.subtotal },
    created: true,
  };
}

// ---------------------------------------------------------------------------
// Wholesale
// ---------------------------------------------------------------------------

export type WholesaleOrderCustomer = {
  businessName: string;
  contactName: string;
  phone: string;
  email?: string;
  deliveryAddress: string;
};

export type WholesalePaidOrderInput = {
  reference: string;
  customer: WholesaleOrderCustomer;
  lines: CartLine[];
  subtotal: number;
  reconstructed?: boolean;
  checkoutWasLocked?: boolean;
};

/**
 * Same idempotent-by-reference shape as createPaidOrderIfNotExists, writing to
 * wholesaleOrders instead of orders, plus a businessCustomers/{phone} upsert so repeat
 * buyers accumulate a real order history instead of a fresh anonymous record each time.
 */
export async function createPaidWholesaleOrderIfNotExists(
  input: WholesalePaidOrderInput
): Promise<{ order: PaidOrderResult; created: boolean }> {
  const db = getAdminDb();

  const existing = await db
    .collection("wholesaleOrders")
    .where("paystackReference", "==", input.reference)
    .limit(1)
    .get();
  if (!existing.empty) {
    const doc = existing.docs[0];
    const data = doc.data();
    return {
      order: {
        id: doc.id,
        status: data.status,
        createdAt: data.createdAt,
        lines: data.lines,
        subtotal: data.subtotal,
      },
      created: false,
    };
  }

  const id = generateOrderId("WHS");
  const now = new Date().toISOString();
  const order = {
    id,
    createdAt: now,
    businessName: input.customer.businessName,
    contactName: input.customer.contactName,
    phone: input.customer.phone,
    deliveryAddress: input.customer.deliveryAddress,
    lines: input.lines,
    subtotal: input.subtotal,
    status: "Processing" as const,
    paystackReference: input.reference,
    paidAt: now,
    ...(input.customer.email ? { email: input.customer.email } : {}),
    ...(input.reconstructed ? { serverValidated: false, webhookReconstructed: true } : {}),
    ...(input.checkoutWasLocked ? { orderedWhileLocked: true } : {}),
  };

  const customerRef = db.collection("businessCustomers").doc(input.customer.phone);
  // firstOrderAt must only ever be written once — a merge write with it included
  // unconditionally would silently overwrite it on every repeat order.
  const customerSnap = await customerRef.get();

  await Promise.all([
    db.collection("wholesaleOrders").doc(id).set(order),
    customerRef.set(
      {
        businessName: input.customer.businessName,
        contactName: input.customer.contactName,
        phone: input.customer.phone,
        deliveryAddress: input.customer.deliveryAddress,
        ...(input.customer.email ? { email: input.customer.email } : {}),
        orderCount: FieldValue.increment(1),
        totalSpent: FieldValue.increment(input.subtotal),
        ...(customerSnap.exists ? {} : { firstOrderAt: now }),
        lastOrderAt: now,
      },
      { merge: true }
    ),
  ]);
  await Promise.all([
    incrementUnitsSold(db, input.lines),
    deductStock(db, input.lines),
    bumpRevenueStats(db, "wholesale", input.subtotal, now),
  ]);

  return {
    order: { id: order.id, status: order.status, createdAt: order.createdAt, lines: order.lines, subtotal: order.subtotal },
    created: true,
  };
}
